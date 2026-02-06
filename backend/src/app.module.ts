import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

// 核心控制器与服务
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 业务逻辑模块
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BlogModule } from './blog/blog.module';
import { UploadModule } from './upload/upload.module';
import { MailModule } from './mail/mail.module';
import { CommonModule } from './common/common.module';

// 数据库实体
import { User } from './user/entities/user.entity';
import { Blog } from './blog/entities/blog.entity';

@Module({
  imports: [
    // 1. 加载环境变量，设置为全局可用
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // 强制只识别根目录下的 .env 文件
    }),

    // 2. 动态数据库模块配置
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        // --- 环境变量提取 ---
        const host = configService.get<string>('DB_HOST');
        const port = configService.get<number>('DB_PORT', 5432);
        const username = configService.get<string>('DB_USER');
        const password = configService.get<string>('DB_PASS');
        const database = configService.get<string>('DB_NAME');
        
        // --- 核心识别逻辑：自动判定是否为远程/Supabase环境 ---
        // 逻辑：如果 Host 包含 'supabase' 字符串，或者 NODE_ENV 不是 development
        const isRemote = host?.includes('supabase') || configService.get('NODE_ENV') === 'production';

        // --- 构建配置对象 ---
        const options: TypeOrmModuleOptions = {
          type: 'postgres',
          host: host,
          port: port,
          username: username,
          password: password,
          database: database,
          // 显式列出所有实体，确保 TypeORM 能正确扫描
          entities: [
            User, 
            Blog
          ],
          // 开发环境下自动同步数据库表结构 (非常方便但需谨慎)
          synchronize: true,
          // 自动负载平衡与连接池配置
          logging: configService.get('NODE_ENV') === 'development',
        };

        // --- 自动注入 SSL 配置 ---
        if (isRemote) {
          // 远程 PostgreSQL (如 Supabase) 强制要求 SSL 握手
          Object.assign(options, {
            ssl: {
              rejectUnauthorized: false, // 允许自签名证书，解决 Supabase 连接报错
            },
          });
        } else {
          // 本地环境直接关闭 SSL，提升连接速度
          Object.assign(options, {
            ssl: false,
          });
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
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService
  ],
})
export class AppModule {}