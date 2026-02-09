# Content of follow

## File: follow/follow.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';

describe('FollowController', () => {
  let controller: FollowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowController],
      providers: [FollowService],
    }).compile();

    controller = module.get<FollowController>(FollowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

```

---
## File: follow/follow.controller.ts

```typescript
import { Controller, Post, Get, Param, UseGuards, Req } from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('社交关注')
@Controller('follow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':id')
  @ApiOperation({ summary: '切换关注状态' })
  toggle(@Param('id') id: string, @Req() req) {
    return this.followService.toggleFollow(req.user.userId, +id);
  }

  @Get('status/:id')
  @ApiOperation({ summary: '检查是否关注了该用户' })
  status(@Param('id') id: string, @Req() req) {
    return this.followService.checkStatus(req.user.userId, +id);
  }

  @Get('my-following')
  @ApiOperation({ summary: '获取我的关注列表' })
  getFollowing(@Req() req) {
    return this.followService.getFollowingList(req.user.userId);
  }

  @Get('my-followers')
  @ApiOperation({ summary: '获取我的粉丝列表' })
  getFollowers(@Req() req) {
    return this.followService.getFollowersList(req.user.userId);
  }
}

```

---
## File: follow/follow.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { Follow } from './entities/follow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Follow])],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService],
})
export class FollowModule {}
```

---
## File: follow/follow.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FollowService } from './follow.service';

describe('FollowService', () => {
  let service: FollowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowService],
    }).compile();

    service = module.get<FollowService>(FollowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

```

---
## File: follow/follow.service.ts

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
  ) {}

  // 关注或取消关注
  async toggleFollow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('你不能关注你自己');
    }

    // 检查是否已经关注
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      // 如果已关注，则取消
      await this.followRepo.remove(existing);
      return { status: false, message: '已取消关注' };
    } else {
      // 如果未关注，则创建记录
      const follow = this.followRepo.create({ followerId, followingId });
      await this.followRepo.save(follow);
      return { status: true, message: '关注成功' };
    }
  }

  // 获取我的关注列表（我关注了谁）
  async getFollowingList(userId: number) {
    return await this.followRepo.find({
      where: { followerId: userId },
      relations: ['following'], // 联查出被关注者的基本信息
    });
  }

  // 获取我的粉丝列表（谁关注了我）
  async getFollowersList(userId: number) {
    return await this.followRepo.find({
      where: { followingId: userId },
      relations: ['follower'], // 联查出粉丝的基本信息
    });
  }

  // 检查是否关注了某人（用于前端 UI 显示）
  async checkStatus(followerId: number, followingId: number) {
    const count = await this.followRepo.count({
      where: { followerId, followingId },
    });
    return { isFollowing: count > 0 };
  }
}

```

---
## File: follow/entities/follow.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('follows')
@Unique(['followerId', 'followingId']) // 确保不会重复关注
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  // 粉丝（发起关注的人）
  @ManyToOne(() => User)
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @ApiProperty({ description: '粉丝ID' })
  @Column()
  followerId: number;

  // 被关注的人（作者）
  @ManyToOne(() => User)
  @JoinColumn({ name: 'followingId' })
  following: User;

  @ApiProperty({ description: '被关注者ID' })
  @Column()
  followingId: number;

  @CreateDateColumn()
  createdAt: Date;
}
```
