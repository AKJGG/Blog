import { Module, Global } from '@nestjs/common';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

@Global() // 标记为全局模块，这样你不需要在每个子模块里 import CommonModule
@Module({
  providers: [
    // 在这里注册，就不需要在 main.ts 里手动 app.useGlobal... 了，效果一样且支持依赖注入
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [],
})
export class CommonModule {}
