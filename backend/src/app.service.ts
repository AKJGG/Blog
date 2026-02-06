import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private dataSource: DataSource) {} // 注入数据库连接

  getHealthStatus() {
    return {
      status: 'Commander, the system is standing by!',
      timestamp: new Date().toISOString(),
      database: this.dataSource.isInitialized ? 'Connected (Stronghold Secure)' : 'Disconnected (Danger!)',
      memory: {
        rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      },
      environment: process.env.NODE_ENV || 'development'
    };
  }
}
