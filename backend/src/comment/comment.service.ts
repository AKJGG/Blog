import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async create(dto: CreateCommentDto, authorId: number) {
    const comment = this.commentRepository.create({
      ...dto,
      authorId,
    });
    return await this.commentRepository.save(comment);
  }

  async findByBlog(blogId: number) {
    return await this.commentRepository.find({
      where: { blogId },
      relations: ['author'], // 加载作者信息（头像、用户名）
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: number, userId: number) {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('评论不存在');
    
    // 只有评论作者才能删除
    if (comment.authorId !== userId) {
      throw new ForbiddenException('你没有权限删除此评论');
    }
    
    await this.commentRepository.remove(comment);
    return { message: '删除成功' };
  }
}
