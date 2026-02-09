# Content of action

## File: action/action.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ActionController } from './action.controller';
import { ActionService } from './action.service';

describe('ActionController', () => {
  let controller: ActionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionController],
      providers: [ActionService],
    }).compile();

    controller = module.get<ActionController>(ActionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

```

---
## File: action/action.controller.ts

```typescript
import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { ActionService } from './action.service';
import { CreateActionDto } from './dto/create-action.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('交互管理')
@Controller('action')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换点赞/收藏状态' })
  toggle(@Body() createActionDto: CreateActionDto, @Req() req) {
    return this.actionService.toggle(createActionDto, req.user.userId);
  }

  @Get('status/:blogId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我对该文章的状态' })
  getStatus(@Param('blogId') blogId: string, @Req() req) {
    return this.actionService.getStatus(+blogId, req.user.userId);
  }
}

```

---
## File: action/action.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionService } from './action.service';
import { ActionController } from './action.controller';
import { Action } from './entities/action.entity';
import { Blog } from '../blog/entities/blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Action, Blog])],
  controllers: [ActionController],
  providers: [ActionService],
})
export class ActionModule {}

```

---
## File: action/action.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ActionService } from './action.service';

describe('ActionService', () => {
  let service: ActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActionService],
    }).compile();

    service = module.get<ActionService>(ActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

```

---
## File: action/action.service.ts

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Action } from './entities/action.entity';
import { CreateActionDto } from './dto/create-action.dto';
import { Blog } from '../blog/entities/blog.entity';

@Injectable()
export class ActionService {
  constructor(
    @InjectRepository(Action)
    private actionRepository: Repository<Action>,
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
  ) {}

  async toggle(dto: CreateActionDto, userId: number) {
    const { blogId, type } = dto;

    // 1. 检查文章是否存在
    const blog = await this.blogRepository.findOneBy({ id: blogId });
    if (!blog) throw new NotFoundException('文章不存在');

    // 2. 查找是否已有记录
    const existing = await this.actionRepository.findOne({
      where: { blogId, userId, type },
    });

    if (existing) {
      // 如果已存在，则删除（取消操作）
      await this.actionRepository.remove(existing);
      return { type, status: false, message: '已取消' };
    } else {
      // 如果不存在，则创建（点赞/收藏）
      const newAction = this.actionRepository.create({
        blogId,
        userId,
        type,
      });
      await this.actionRepository.save(newAction);
      return { type, status: true, message: '操作成功' };
    }
  }

  async getStatus(blogId: number, userId: number) {
    const actions = await this.actionRepository.find({
      where: { blogId, userId },
    });

    return {
      isLiked: actions.some((a) => a.type === 'like'),
      isFavorited: actions.some((a) => a.type === 'favorite'),
    };
  }
}

```

---
## File: action/dto/create-action.dto.ts

```typescript
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActionDto {
  @ApiProperty({ enum: ['like', 'favorite'], description: '类型' })
  @IsEnum(['like', 'favorite'], { message: '类型必须是 like 或 favorite' })
  @IsNotEmpty()
  type: 'like' | 'favorite';

  @ApiProperty({ description: '文章ID' })
  @IsInt()
  @IsNotEmpty()
  blogId: number;
}

```

---
## File: action/dto/update-action.dto.ts

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateActionDto } from './create-action.dto';

export class UpdateActionDto extends PartialType(CreateActionDto) {}

```

---
## File: action/entities/action.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Blog } from '../../blog/entities/blog.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('actions')
@Unique(['userId', 'blogId', 'type']) // 防止重复点赞/收藏
export class Action {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '操作类型：like(点赞), favorite(收藏)' })
  @Column({ type: 'varchar', length: 20 })
  type: 'like' | 'favorite';

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Blog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blogId' })
  blog: Blog;

  @Column()
  blogId: number;
}

```
