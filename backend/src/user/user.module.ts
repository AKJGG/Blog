import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [
    // 将 User 实体注册到 TypeORM 模块中
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // 关键：必须导出才能让 AuthModule 里的 AuthService 使用 UserService
})
export class UserModule {}
