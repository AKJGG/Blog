# Content of notification

## File: notification/notification.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [NotificationService],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

```

---
## File: notification/notification.controller.ts

```typescript
import { Controller, Get, Patch, Body, UseGuards, Req, Query, Delete } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('消息中心')
@Controller('notification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('list')
  @ApiOperation({ summary: '分页获取我的通知' })
  getList(@Req() req, @Query('page') page: number) {
    return this.service.getNotifications(req.user.userId, page || 1);
  }

  @Patch('batch-read')
  @ApiOperation({ summary: '批量标记已读' })
  readBatch(@Req() req, @Body('ids') ids: number[]) {
    return this.service.batchMarkAsRead(req.user.userId, ids);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '一键全读' })
  readAll(@Req() req) {
    return this.service.markAllAsRead(req.user.userId);
  }
}

```

---
## File: notification/notification.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationSubscriber } from './notification.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationSubscriber],
  exports: [NotificationService],
})
export class NotificationModule {}
```

---
## File: notification/notification.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

```

---
## File: notification/notification.service.ts

```typescript
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifyRepo: Repository<Notification>,
  ) {}

  /**
   * 复杂查询：获取分页通知并联查用户信息
   */
  async getNotifications(userId: number, page = 1, limit = 20) {
    try {
      const [items, total] = await this.notifyRepo.findAndCount({
        where: { userId },
        relations: ['fromUser'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        items,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`获取通知失败: ${error.message}`);
      throw new InternalServerErrorException('服务器忙，请稍后再试');
    }
  }

  /**
   * 批量已读：一次性处理多条消息
   */
  async batchMarkAsRead(userId: number, ids: number[]) {
    if (!ids.length) return { affected: 0 };
    return await this.notifyRepo.update(
      { id: In(ids), userId }, 
      { isRead: true }
    );
  }

  /**
   * 一键全读
   */
  async markAllAsRead(userId: number) {
    return await this.notifyRepo.update({ userId, isRead: false }, { isRead: true });
  }

  /**
   * 消息清理（维护逻辑）：自动删除 30 天前的已读旧通知，防止表爆炸
   */
  async cleanOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await this.notifyRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :date AND isRead = :isRead', { date: thirtyDaysAgo, isRead: true })
      .execute();
      
    this.logger.log(`系统自动清理了 ${result.affected} 条旧通知`);
  }
}

```

---
## File: notification/notification.subscriber.ts

```typescript
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, DataSource } from 'typeorm';
import { Action } from '../action/entities/action.entity';
import { Comment } from '../comment/entities/comment.entity';
import { Follow } from '../follow/entities/follow.entity';
import { Blog } from '../blog/entities/blog.entity';
import { Notification } from './entities/notification.entity';

// 必须确保这里有 export 关键字！
@EventSubscriber()
export class NotificationSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  async afterInsert(event: InsertEvent<any>) {
    const { entity, metadata, manager } = event;
    const notifyRepo = manager.getRepository(Notification);

    // --- 逻辑 A：处理 Action 模块 (点赞/收藏) ---
    if (metadata.target === Action) {
      const action = entity as Action;
      // 这里的 as any 是为了绕过 TypeORM findOne 的类型推断 bug
      const blog = await manager.findOneBy(Blog, { id: action.blogId } as any);
      
      if (blog && blog.authorId !== action.userId) {
        await notifyRepo.save({
          userId: blog.authorId,
          fromUserId: action.userId,
          type: action.type,
          content: action.type === 'like' ? `赞了你的文章: ${blog.title}` : `收藏了你的文章: ${blog.title}`,
          relatedId: action.blogId,
          payload: { actionId: action.id }
        });
      }
    }

    // --- 逻辑 B：处理 Comment 模块 (评论) ---
    if (metadata.target === Comment) {
      const comment = entity as Comment;
      const blog = await manager.findOneBy(Blog, { id: comment.blogId } as any);
      
      if (blog && blog.authorId !== comment.authorId) {
        await notifyRepo.save({
          userId: blog.authorId,
          fromUserId: comment.authorId,
          type: 'comment',
          content: `评论了你的文章《${blog.title}》: "${comment.content.substring(0, 20)}..."`,
          relatedId: comment.blogId,
          payload: { commentId: comment.id }
        });
      }
    }

    // --- 逻辑 C：处理 Follow 模块 (关注) ---
    if (metadata.target === Follow) {
      const follow = entity as Follow;
      await notifyRepo.save({
        userId: follow.followingId,
        fromUserId: follow.followerId,
        type: 'follow',
        content: '成为了你的新粉丝',
      });
    }
  }
}
```

---
## File: notification/entities/notification.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('notifications')
export class Notification {
  @ApiProperty()
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @ApiProperty({ description: '消息接收者' })
  @Index() // 索引优化，查询“我的消息”极快
  @Column()
  userId: number;

  @ApiProperty({ description: '动作触发者' })
  @Column()
  fromUserId: number;

  @ApiProperty({ description: '业务类型', enum: ['like', 'favorite', 'comment', 'follow'] })
  @Index()
  @Column({ type: 'varchar', length: 32 })
  type: string;

  @ApiProperty({ description: '通知文本正文' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '阅读状态' })
  @Column({ default: false })
  isRead: boolean;

  @ApiProperty({ description: '关联的业务实体ID' })
  @Column({ nullable: true })
  relatedId: number;

  @ApiProperty({ description: '扩展数据，存储原始记录的部分快照' })
  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'fromUserId' })
  fromUser: User;
}

```
