# SRC Root Files

## File: app.controller.ts

```typescript
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
```

---
## File: app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

// 核心控制器与服务
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 基础业务逻辑模块
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BlogModule } from './blog/blog.module';
import { UploadModule } from './upload/upload.module';
import { MailModule } from './mail/mail.module';
import { CommonModule } from './common/common.module';
import { CommentModule } from './comment/comment.module';
import { ActionModule } from './action/action.module';

// 你刚写完的四大核心业务模块 (1, 2, 3, 5)
import { NotificationModule } from './notification/notification.module';
import { FollowModule } from './follow/follow.module';
import { StatisticsModule } from './statistics/statistics.module';
import { SearchModule } from './search/search.module';

// 核心数据库实体 (必须全部列出，否则 synchronize 无法自动建表)
import { User } from './user/entities/user.entity';
import { Blog } from './blog/entities/blog.entity';
import { Follow } from './follow/entities/follow.entity';
import { Notification } from './notification/entities/notification.entity';
import { Action } from './action/entities/action.entity';

@Module({
  imports: [
    // 1. 加载环境变量
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', 
    }),

    // 2. 动态数据库模块配置 (支持本地与 Supabase 自动切换)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const host = configService.get<string>('DB_HOST');
        const port = configService.get<number>('DB_PORT', 5432);
        const username = configService.get<string>('DB_USER');
        const password = configService.get<string>('DB_PASS');
        const database = configService.get<string>('DB_NAME');
        
        // 判定是否为远程/Supabase环境
        const isRemote = host?.includes('supabase') || configService.get('NODE_ENV') === 'production';

        const options: TypeOrmModuleOptions = {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          // 注册所有业务实体，确保 1, 3 模块的表能自动创建
          entities: [
            User, 
            Blog,
            Follow,
            Notification,
            Action
          ],
          // 保持开启，确保新模块字段（如统计用的 views）能同步到库
          synchronize: true,
          logging: configService.get('NODE_ENV') === 'development',
        };

        // 自动注入 SSL 配置以适配 Supabase
        if (isRemote) {
          Object.assign(options, {
            ssl: { rejectUnauthorized: false },
          });
        } else {
          Object.assign(options, { ssl: false });
        }

        return options;
      },
    }),

    // 3. 业务模块装载
    CommonModule,
    AuthModule,
    UserModule,
    BlogModule,
    UploadModule,
    MailModule,
    CommentModule,
    ActionModule,
    NotificationModule,
    FollowModule,
    StatisticsModule,
    SearchModule,
    // RoleModule 已按要求移除
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---
## File: app.service.ts

```typescript
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

```

---
## File: main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('DuckBootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- 关键修改：从环境变量读取端口，读取不到则默认 8000 ---
  const PORT = process.env.PORT || 8000;
  const PREFIX = 'api/v1';

  // 1. 全局前缀与跨域
  app.setGlobalPrefix(PREFIX);
  app.enableCors({
    origin: ['http://localhost:3000'], 
    credentials: true,
  });

  // 2. 静态资源映射
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // 3. 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 4. Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('Duck Blog API')
    .setDescription('Nuxt 4 + NestJS + Supabase 全栈项目后端接口')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 5. 启动服务：使用动态端口
  await app.listen(PORT);

  // --- 漂亮的启动提示 ---
  const baseUrl = `http://localhost:${PORT}`;
  const dbStatus = process.env.DB_HOST?.includes('supabase') ? 'Supabase (Remote)' : 'PostgreSQL (Local)';
  
  console.log('\n' + '⭐'.repeat(25));
  logger.log(`🚀 服务启动成功！`);
  logger.log(`🔗 API 根地址:   ${baseUrl}/${PREFIX}`);
  logger.log(`📄 Swagger 文档:  ${baseUrl}/docs`);
  logger.log(`🗄️  当前数据库:   ${dbStatus}`);
  logger.log(`🛠️  当前环境:     ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📡 监听端口:     ${PORT}`); // 打印出实际监听的端口
  console.log('⭐'.repeat(25) + '\n');
}
bootstrap();

```

---
## File: app.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});

```
