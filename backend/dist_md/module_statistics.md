# Content of statistics

## File: statistics/statistics.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

describe('StatisticsController', () => {
  let controller: StatisticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [StatisticsService],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

```

---
## File: statistics/statistics.controller.ts

```typescript
import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('数据统计')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的全站数据概览' })
  getMyStats(@Req() req) {
    return this.statisticsService.getUserOverview(req.user.userId);
  }

  @Get('user/:id')
  @ApiOperation({ summary: '获取指定用户的数据概览' })
  getUserStats(@Param('id') id: string) {
    return this.statisticsService.getUserOverview(+id);
  }

  @Post('hit/:blogId')
  @ApiOperation({ summary: '上报文章阅读量' })
  reportView(@Param('blogId') blogId: string) {
    return this.statisticsService.addView(+blogId);
  }
}

```

---
## File: statistics/statistics.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Blog } from '../blog/entities/blog.entity';
import { Follow } from '../follow/entities/follow.entity';
import { Action } from '../action/entities/action.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Blog, Follow, Action]) // 借用其他模块的实体
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
```

---
## File: statistics/statistics.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticsService],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

```

---
## File: statistics/statistics.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Blog } from '../blog/entities/blog.entity';
import { Follow } from '../follow/entities/follow.entity';
import { Action } from '../action/entities/action.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Blog)
    private blogRepo: Repository<Blog>,
    @InjectRepository(Follow)
    private followRepo: Repository<Follow>,
    @InjectRepository(Action)
    private actionRepo: Repository<Action>,
  ) {}

  // 获取用户核心数据概览
  async getUserOverview(userId: number) {
    // 1. 获取该用户的所有文章 ID 和 阅读量
    const userBlogs = await this.blogRepo.find({
      where: { authorId: userId },
      select: ['id', 'views']
    });
    const blogIds = userBlogs.map(b => b.id);

    // 2. 累加总阅读量
    const totalViews = userBlogs.reduce((sum, b) => sum + (b.views || 0), 0);

    // 3. 统计收到的点赞总数 (Action 表中 type='like' 且 blogId 属于该用户)
    let totalLikes = 0;
    if (blogIds.length > 0) {
      totalLikes = await this.actionRepo.count({
        where: { blogId: In(blogIds), type: 'like' }
      });
    }

    // 4. 统计粉丝数和关注数
    const followers = await this.followRepo.count({ where: { followingId: userId } });
    const following = await this.followRepo.count({ where: { followerId: userId } });

    return {
      blogCount: userBlogs.length,
      totalViews,
      totalLikes,
      followers,
      following
    };
  }

  // 增加文章阅读数
  async addView(blogId: number) {
    return await this.blogRepo.increment({ id: blogId }, 'views', 1);
  }
}

```
