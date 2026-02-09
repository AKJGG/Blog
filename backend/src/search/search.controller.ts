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