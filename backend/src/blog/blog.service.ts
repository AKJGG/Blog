import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  async create(dto: CreateBlogDto) {
    const blog = this.blogRepository.create(dto);
    return await this.blogRepository.save(blog);
  }

  async findAll(category?: string) {
    const query = this.blogRepository.createQueryBuilder('blog')
      .leftJoinAndSelect('blog.author', 'author');
    
    if (category) {
      query.where('blog.category = :category', { category });
    }

    return await query.orderBy('blog.createdAt', 'DESC').getMany();
  }

  async findByUser(authorId: number) {
    return await this.blogRepository.find({
      where: { authorId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number) {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['author']
    });
    if (!blog) throw new NotFoundException('文章不存在');
    return blog;
  }

  async update(id: number, dto: UpdateBlogDto) {
    await this.blogRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const blog = await this.findOne(id);
    return await this.blogRepository.remove(blog);
  }
}
