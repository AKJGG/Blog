import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('系统监控')
@Controller() // 匹配 api/v1 根路径
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '检阅全军战备状态 (Health Check)' })
  getHealth() {
    return this.appService.getHealthStatus();
  }
}