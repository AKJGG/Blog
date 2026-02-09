# Content of auth

## File: auth/auth.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

```

---
## File: auth/auth.controller.ts

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordResetRequestDto, PasswordResetConfirmDto } from './dto/password-reset.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '注册' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '登录' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('password-reset-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发起重置请求' })
  requestReset(@Body() dto: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset-confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '确认重置密码' })
  confirmReset(@Body() dto: PasswordResetConfirmDto) {
    return this.authService.confirmPasswordReset(dto);
  }
}

```

---
## File: auth/auth.module.ts

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    UserModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

```

---
## File: auth/auth.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

```

---
## File: auth/auth.service.ts

```typescript
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordResetRequestDto, PasswordResetConfirmDto } from './dto/password-reset.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (user) throw new BadRequestException('该邮箱已被注册');
    
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.userService.create({ ...dto, password: hashedPassword });
  }

  async login(dto: LoginDto) {
    // 特别注意：因为 Entity 设置了 select: false，这里需要 userService 提供支持查密码的方法
    const user = await this.userService.findWithPassword(dto.username);
    if (!user) throw new UnauthorizedException('用户名或密码错误');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('用户名或密码错误');

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, avatar: user.avatar }
    };
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const user = await this.userService.findByUsernameAndEmail(dto.username, dto.email);
    if (!user) throw new BadRequestException('用户信息不匹配');

    const token = this.jwtService.sign({ sub: user.id, type: 'reset' }, { expiresIn: '15m' });
    await this.mailService.sendResetEmail(user.email, token);
    return { message: '邮件已发送' };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto) {
    try {
      const payload = this.jwtService.verify(dto.token);
      if (payload.type !== 'reset') throw new Error();
      
      const hashedPassword = await bcrypt.hash(dto.new_password, 10);
      await this.userService.updatePassword(payload.sub, hashedPassword);
      return { message: '修改成功' };
    } catch (e) {
      throw new BadRequestException('链接无效或已过期');
    }
  }
}

```

---
## File: auth/jwt.strategy.ts

```typescript
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    
    // 如果没有配置密钥，直接抛错或者给默认值，防止服务启动后验证失效
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in .env file');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // 此时 secret 确定是 string 类型
    });
  }

  // 当 JWT 验证通过后，这个方法会被调用
  async validate(payload: any) {
    // 检查 payload 是否有效
    if (!payload.sub || !payload.username) {
      throw new UnauthorizedException('Token 无效');
    }
    
    // 返回的内容会挂载到 req.user 上
    return { userId: payload.sub, username: payload.username };
  }
}
```

---
## File: auth/jwt-auth.guard.ts

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

---
## File: auth/dto/password-reset.dto.ts

```typescript
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

// 1. 发起重置请求（对应 password-reset.vue）
export class PasswordResetRequestDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}

// 2. 确认重置（对应 [id]-password-reset.vue）
export class PasswordResetConfirmDto {
  @IsNotEmpty()
  token: string; // 路由参数中的 id

  @IsNotEmpty()
  @MinLength(6, { message: '新密码至少6位' })
  new_password: string; // 注意：对接前端字段名 new_password
}
```

---
## File: auth/dto/register.dto.ts

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '用户名', minLength: 3, maxLength: 20 })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @ApiProperty({ description: '电子邮箱' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '密码', format: 'password' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少需要 6 位' })
  // 选做：强制要求包含字母和数字
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: '密码强度太弱（需包含大小写字母和数字）',
  })
  password: string;
}

```

---
## File: auth/dto/login.dto.ts

```typescript
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    description: '用户名', 
    required: true,
    minLength: 3,
    maxLength: 20
  })
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名长度不能少于3位' })
  @MaxLength(20, { message: '用户名长度不能超过20位' })
  username: string;

  @ApiProperty({ 
    description: '密码', 
    required: true,
    format: 'password'
  })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  password: string;
}
```
