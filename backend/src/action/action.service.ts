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
