# Content of user

## File: user/user.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

```

---
## File: user/user.controller.ts

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: '管理员创建用户' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'page', required: false })
  findAll(@Query('page') page: string) {
    return this.userService.findAll(+page || 1);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前登录个人信息' })
  getProfile(@Req() req) {
    return this.userService.findOne(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定用户信息' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '注销/删除用户' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
```

---
## File: user/user.module.ts

```typescript
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

```

---
## File: user/user.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

```

---
## File: user/user.service.ts

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // 1. 创建用户
  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  // 2. 登录专用：强制拉取密码字段 (解决 select: false 问题)
  async findWithPassword(username: string) {
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  // 3. 基础查询 (不带密码)
  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  // 4. 分页查询 (解决 UserController 里的 findAll 报错)
  async findAll(page: number = 1) {
    const limit = 10;
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // 5. 更新用户信息
  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  // 6. 删除用户 (解决 UserController 里的 remove 报错)
  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { success: true, message: '用户已成功删除' };
  }

  // 7. 修改密码专用 (解决 AuthService 里的 updatePassword 报错)
  async updatePassword(id: number, hashedPassword: string) {
    await this.userRepository.update(id, { password: hashedPassword });
    return { success: true };
  }

  // 8. 辅助查询：通过用户名 (解决注册重复检查)
  async findByUsername(username: string) {
    return await this.userRepository.findOne({ where: { username } });
  }

  // 9. 辅助查询：通过邮箱 (解决 AuthService 里的 findByEmail 报错)
  async findByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  // 10. 辅助查询：用户名和邮箱 (解决 AuthService 里的 findByUsernameAndEmail 报错)
  async findByUsernameAndEmail(username: string, email: string) {
    return await this.userRepository.findOne({ where: { username, email } });
  }
}

```

---
## File: user/dto/create-user.dto.ts

```typescript
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  username: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;
}

```

---
## File: user/dto/update-user.dto.ts

```typescript
import { IsOptional, IsString, IsEmail } from 'class-validator';
import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: '更新时间戳', required: false })
  @IsOptional()
  updatedAt?: Date;
}
```

---
## File: user/entities/user.entity.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Blog } from '../../blog/entities/blog.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() // 昵称不再强制唯一（根据你需求定，通常昵称可以重复，账号email不能重复）
  username: string;

  @Column({ unique: true }) // 登录账号
  email: string;

  @Column({ select: false }) 
  password: string;

  @Column({ nullable: true, default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' })
  avatar: string;

  @Column({ nullable: true })
  bio: string;

  @OneToMany(() => Blog, (blog) => blog.author)
  blogs: Blog[];

  @CreateDateColumn()
  createdAt: Date;
}

```
