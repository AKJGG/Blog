export interface ApiResponse<T = any> {
  code: number;      // 业务状态码 (如 200, 401, 500)
  success: boolean;   // 是否成功
  message: string;    // 提示信息
  data: T;            // 数据主体
  timestamp: string;  // 响应时间
}
