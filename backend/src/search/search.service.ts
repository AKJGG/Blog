import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Blog } from '../blog/entities/blog.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepo: Repository<Blog>,
  ) {}

  // 全局搜索：匹配标题或内容
  async findAll(keyword: string) {
    if (!keyword) return [];

    return await this.blogRepo.find({
      where: [
        { title: Like(`%${keyword}%`) },   // 匹配标题
        { content: Like(`%${keyword}%`) } // 匹配内容
      ],
      relations: ['author'], // 关联作者，方便前端显示头像和昵称
      order: { createdAt: 'DESC' },
      // 仅返回前端需要的字段，减小开销
      select: {
        id: true,
        title: true,
        summary: true,
        createdAt: true,
        author: {
          username: true,
          avatar: true
        }
      }
    });
  }

  // 按分类精确搜索
  async findByCategory(category: string) {
    return await this.blogRepo.find({
      where: { category },
      relations: ['author'],
      order: { createdAt: 'DESC' }
    });
  }
}
