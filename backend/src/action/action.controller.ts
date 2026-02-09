import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { ActionService } from './action.service';
import { CreateActionDto } from './dto/create-action.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('交互管理')
@Controller('action')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换点赞/收藏状态' })
  toggle(@Body() createActionDto: CreateActionDto, @Req() req) {
    return this.actionService.toggle(createActionDto, req.user.userId);
  }

  @Get('status/:blogId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我对该文章的状态' })
  getStatus(@Param('blogId') blogId: string, @Req() req) {
    return this.actionService.getStatus(+blogId, req.user.userId);
  }
}
