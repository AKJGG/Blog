# Content of common

## File: common/common.module.ts

```typescript
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

```

---
## File: common/api-response.interface.ts

```typescript
// src/common/interfaces/api-response.interface.ts

export interface ApiResponse<T = any> {
  code: number;    // 业务状态码，例如 200 成功，10001 用户不存在
  data: T;         // 具体的业务数据
  message: string; // 给前端的提示信息
  success: boolean; // 简化判断的布尔值
}
```

---
## File: common/interceptors/transform.interceptor.ts

```typescript
// src/common/interceptors/transform.interceptor.ts (仅规范化，不重构逻辑)
// 保持你原来的逻辑，但使用统一的 code 变量
return next.handle().pipe(
  map((data) => ({
    data,
    code: 200, 
    message: '请求成功',
    success: true, // 建议加上这个，方便前端在 if (res.success) 中判断
  })),
);

```

---
## File: common/filters/http-exception.filter.ts

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    response.status(status).json({
      code: status,
      message: exceptionResponse.message || exception.message,
      success: false,
    });
  }
}
```

---
## File: common/utils/hash.util.ts

```typescript
import * as bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

```
