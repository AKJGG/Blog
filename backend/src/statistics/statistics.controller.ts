import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('数据统计')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的全站数据概览' })
  getMyStats(@Req() req) {
    return this.statisticsService.getUserOverview(req.user.userId);
  }

  @Get('user/:id')
  @ApiOperation({ summary: '获取指定用户的数据概览' })
  getUserStats(@Param('id') id: string) {
    return this.statisticsService.getUserOverview(+id);
  }

  @Post('hit/:blogId')
  @ApiOperation({ summary: '上报文章阅读量' })
  reportView(@Param('blogId') blogId: string) {
    return this.statisticsService.addView(+blogId);
  }
}
