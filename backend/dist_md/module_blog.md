# Content of blog

## File: blog/blog.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

describe('BlogController', () => {
  let controller: BlogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [BlogService],
    }).compile();

    controller = module.get<BlogController>(BlogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

```

---
## File: blog/blog.controller.ts

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('内容管理')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布文章' })
  create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogService.create(createBlogDto);
  }

  @Get('list')
  @ApiOperation({ summary: '获取文章列表 (支持分类过滤)' })
  findAll(@Query('category') category: string) {
    return this.blogService.findAll(category);
  }

  @Get('user/:id')
  @ApiOperation({ summary: '获取指定用户的文章' })
  findByUser(@Param('id') id: string) {
    return this.blogService.findByUser(+id);
  }

  @Get(':id')
  @ApiOperation({ summary: '文章详情' })
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新文章' })
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogService.update(+id, updateBlogDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除文章' })
  remove(@Param('id') id: string) {
    return this.blogService.remove(+id);
  }
}

```

---
## File: blog/blog.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { Blog } from './entities/blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Blog])],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}

```

---
## File: blog/blog.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BlogService } from './blog.service';

describe('BlogService', () => {
  let service: BlogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlogService],
    }).compile();

    service = module.get<BlogService>(BlogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

```

---
## File: blog/blog.service.ts

```typescript
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

```

---
## File: blog/dto/create-blog.dto.ts

```typescript
import { IsNotEmpty, IsString, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  authorId: number;
}
```

---
## File: blog/dto/update-blog.dto.ts

```typescript
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateBlogDto } from './create-blog.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateBlogDto extends PartialType(CreateBlogDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
```

---
## File: blog/entities/blog.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('blogs')
export class Blog {
  @ApiProperty({ description: '文章ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '标题' })
  @Column()
  title: string;

  @ApiProperty({ description: '摘要', required: false })
  @Column({ type: 'text', nullable: true })
  summary: string; // 已修复：对应 search.service 中的查询

  @ApiProperty({ description: '正文内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '封面图地址', required: false })
  @Column({ nullable: true })
  cover: string;

  @ApiProperty({ description: '分类名称' })
  @Column()
  category: string;

  @ApiProperty({ description: '标签列表', type: [String] })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({ description: '阅读量' })
  @Column({ default: 0 })
  views: number; // 已修复：对应 statistics.service 中的计算

  @ApiProperty({ description: '是否发布' })
  @Column({ default: false })
  isPublished: boolean;

  // --- 关联关系 ---

  @ApiProperty({ description: '作者ID' })
  @Column()
  authorId: number; // 显式列出 authorId，方便 Subscriber 和 Service 直接使用

  @ManyToOne(() => User, (user) => user.blogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' }) // 明确指定外键列名
  author: User;

  // --- 时间戳 ---

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}
```
