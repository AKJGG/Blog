import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    // 提取错误消息：如果是 class-validator 的数组，取第一个；否则取 message 字段
    const errorMsg = Array.isArray(exceptionResponse.message)
      ? exceptionResponse.message[0]
      : exceptionResponse.message || exception.message;

    response.status(status).json({
      code: status,
      success: false,
      message: errorMsg,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
