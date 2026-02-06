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