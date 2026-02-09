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
