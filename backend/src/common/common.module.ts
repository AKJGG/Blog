import { Module, Global, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER, APP_PIPE } from '@nestjs/core';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Global()
@Module({
  providers: [
    // 1. 全局响应拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // 2. 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // 3. 全局参数验证管道 (启用 DTO 自动转换和过滤)
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,        // 自动剔除 DTO 中未定义的属性
        transform: true,        // 自动将 URL 参数转换为 DTO 定义的类型
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class CommonModule {}
