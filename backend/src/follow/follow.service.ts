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
