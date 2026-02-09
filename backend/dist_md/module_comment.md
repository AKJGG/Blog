# Content of comment

## File: comment/comment.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

describe('CommentController', () => {
  let controller: CommentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [CommentService],
    }).compile();

    controller = module.get<CommentController>(CommentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

```

---
## File: comment/comment.controller.ts

```typescript
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('评论管理')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布评论' })
  create(@Body() createCommentDto: CreateCommentDto, @Req() req) {
    // 从 JWT 中获取当前登录用户 ID
    const userId = req.user.userId;
    return this.commentService.create(createCommentDto, userId);
  }

  @Get('blog/:blogId')
  @ApiOperation({ summary: '获取文章的所有评论' })
  findByBlog(@Param('blogId') blogId: string) {
    return this.commentService.findByBlog(+blogId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除评论' })
  remove(@Param('id') id: string, @Req() req) {
    return this.commentService.remove(+id, req.user.userId);
  }
}

```

---
## File: comment/comment.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment])],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}

```

---
## File: comment/comment.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';

describe('CommentService', () => {
  let service: CommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentService],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

```

---
## File: comment/comment.service.ts

```typescript
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

```

---
## File: comment/dto/create-comment.dto.ts

```typescript
import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: '评论内容' })
  @IsString()
  @IsNotEmpty({ message: '评论内容不能为空' })
  content: string;

  @ApiProperty({ description: '所属文章ID' })
  @IsInt()
  @IsNotEmpty()
  blogId: number;

  @ApiProperty({ description: '父评论ID', required: false })
  @IsOptional()
  @IsInt()
  parentId?: number;
}

```

---
## File: comment/dto/update-comment.dto.ts

```typescript
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateCommentDto } from './create-comment.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  // 通常评论只允许修改 content 字段
  @ApiProperty({ description: '修改后的评论内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;
}

```

---
## File: comment/entities/comment.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Blog } from '../../blog/entities/blog.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('comments')
export class Comment {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '评论内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  // 关联文章
  @ManyToOne(() => Blog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blogId' })
  blog: Blog;

  @Column()
  blogId: number;

  // 关联作者
  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: number;

  // 可选：支持二级评论（父评论ID）
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  parentId: number;
}

```
