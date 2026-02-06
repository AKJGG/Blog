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
