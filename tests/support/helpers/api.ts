/**
 * API 测试辅助函数
 *
 * 提供常用的 API 请求方法
 */

/**
 * API 请求配置
 */
export interface ApiRequestConfig {
  baseURL?: string;
  token?: string;
  headers?: Record<string, string>;
}

/**
 * 通用的 API 请求辅助类
 */
export class ApiHelper {
  private baseURL: string;
  private token: string | null = null;

  constructor(config: ApiRequestConfig = {}) {
    this.baseURL = config.baseURL || process.env.API_URL || 'http://localhost:3000';
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token: string): void {
    this.token = token;
  }

  /**
   * 清除认证令牌
   */
  clearAuthToken(): void {
    this.token = null;
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * GET 请求
   */
  async get(endpoint: string, config: RequestInit = {}): Promise<Response> {
    return fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      ...config,
    });
  }

  /**
   * POST 请求
   */
  async post(endpoint: string, data: unknown, config: RequestInit = {}): Promise<Response> {
    return fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      ...config,
    });
  }

  /**
   * PUT 请求
   */
  async put(endpoint: string, data: unknown, config: RequestInit = {}): Promise<Response> {
    return fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      ...config,
    });
  }

  /**
   * DELETE 请求
   */
  async delete(endpoint: string, config: RequestInit = {}): Promise<Response> {
    return fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      ...config,
    });
  }
}

/**
 * 等待辅助函数
 *
 * 用于轮询等待某个条件成立
 */
export const waitFor = async (
  condition: () => Promise<boolean> | boolean,
  timeout = 5000,
  interval = 100,
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`条件未在 ${timeout}ms 内满足`);
};
