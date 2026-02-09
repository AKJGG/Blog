# Content of search

## File: search/search.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [SearchService],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

```

---
## File: search/search.controller.ts

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('搜索模块')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: '全站模糊搜索文章' })
  @ApiQuery({ name: 'q', description: '搜索关键词', required: true })
  search(@Query('q') keyword: string) {
    return this.searchService.findAll(keyword);
  }

  @Get('filter')
  @ApiOperation({ summary: '按分类过滤文章' })
  @ApiQuery({ name: 'cat', description: '分类名称', required: true })
  filter(@Query('cat') category: string) {
    return this.searchService.findByCategory(category);
  }
}
```

---
## File: search/search.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Blog } from '../blog/entities/blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Blog])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}

```

---
## File: search/search.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchService],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

```

---
## File: search/search.service.ts

```typescript
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

```
