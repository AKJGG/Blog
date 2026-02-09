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
