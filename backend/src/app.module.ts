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