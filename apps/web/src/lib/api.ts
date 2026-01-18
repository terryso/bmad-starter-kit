import axios from 'axios';
import type {
  CreateUserDto,
  LoginDto,
  User,
  ApiResponse,
  LoginResponseDto,
  UpdateUserDto,
  SystemStats,
  UsersListResponse,
  GetProjectsParams,
  ProjectsListResponse,
  ProjectDetail,
  RelatedProjectsResponse,
} from '@bmad-starter-kit/shared';
import { useAuthStore } from '@/stores/auth.store';

// 开发环境使用 Vite 代理，生产环境使用环境变量配置的 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 支持 HttpOnly Cookie
});

// 请求拦截器 - 自动携带 Token (从 Zustand store 读取)
api.interceptors.request.use(
  (config) => {
    // refresh 请求只依赖 cookie，不需要 Authorization header
    if (config.url === '/api/v1/auth/refresh') {
      return config;
    }

    // 其他请求从 Zustand store 读取 accessToken
    const getAccessToken = useAuthStore.getState().getAccessToken;
    const token = getAccessToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 如果是 401 错误且不是刷新 token 的请求，且未重试过
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/api/v1/auth/refresh'
    ) {
      originalRequest._retry = true;

      try {
        // 尝试刷新 token
        const refreshAuth = useAuthStore.getState().refreshAuth;
        const success = await refreshAuth?.();

        if (success) {
          // 刷新成功，重试原始请求
          const newToken = useAuthStore.getState().getAccessToken?.();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // 刷新失败，清除认证状态并跳转登录页
      const clearAuth = useAuthStore.getState().clearAuth;
      clearAuth?.();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// 认证 API
export const authApi = {
  register: async (data: CreateUserDto): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/api/v1/auth/register', data);
    return response.data;
  },
  login: async (data: LoginDto): Promise<ApiResponse<LoginResponseDto>> => {
    const response = await api.post<ApiResponse<LoginResponseDto>>('/api/v1/auth/login', data);
    return response.data;
  },
  /**
   * 使用 refresh token 刷新 access token
   * refresh token 从 HttpOnly cookie 中自动发送
   */
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string; user: User }>> => {
    const response = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/api/v1/auth/refresh');
    return response.data;
  },
  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/api/v1/auth/logout');
    return response.data;
  },
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/api/v1/users/me');
    return response.data;
  },
};

// 用户 API
export const usersApi = {
  /**
   * 获取当前用户信息
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/api/v1/users');
    return response.data;
  },

  /**
   * 更新当前用户信息
   * @param data 包含可选 name 字段的对象
   */
  updateProfile: async (data: UpdateUserDto): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>('/api/v1/users', data);
    return response.data;
  },
};

// Admin API
export const adminApi = {
  /**
   * 获取所有用户列表 (仅管理员)
   * @param params 查询参数 (分页、搜索、角色筛选)
   */
  getUsers: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: 'USER' | 'ADMIN';
  }): Promise<UsersListResponse> => {
    const response = await api.get<{
      data: {
        items: Array<{
          id: string;
          email: string;
          name: string;
          role: 'USER' | 'ADMIN';
          createdAt: string;
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      statusCode: number;
      message: string;
    }>('/api/v1/admin/users', { params });

    const { data } = response.data;
    return {
      users: data.items.map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt), // Convert string to Date
        lastActiveAt: null, // API 不返回此字段
      })),
      pagination: {
        page: data.page,
        pageSize: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      },
    };
  },

  /**
   * 获取系统统计数据 (仅管理员)
   * 返回用户统计信息
   */
  getStats: async (): Promise<{ data: SystemStats; statusCode: number; message: string }> => {
    const response = await api.get<{ data: SystemStats; statusCode: number; message: string }>(
      '/api/v1/admin/stats'
    );
    return response.data;
  },

  /**
   * 删除单个用户 (仅管理员)
   * @param id 用户 ID
   * @param currentUserId 当前用户 ID (防止删除自己)
   */
  deleteUser: async (id: string, currentUserId?: string): Promise<void> => {
    if (id === currentUserId) {
      throw new Error('不能删除自己的账户');
    }
    await api.delete(`/api/v1/admin/users/${id}`);
  },

  /**
   * 批量删除用户 (仅管理员)
   * @param ids 用户 ID 数组
   * @param currentUserId 当前用户 ID (防止删除自己)
   */
  batchDeleteUsers: async (ids: string[], currentUserId?: string): Promise<{ success: number; failed: number; errors: string[] }> => {
    // 过滤掉当前用户
    const filteredIds = currentUserId ? ids.filter(id => id !== currentUserId) : ids;

    if (filteredIds.length === 0) {
      throw new Error('没有可选择删除的用户');
    }

    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    // 并发删除请求
    const results = await Promise.allSettled(
      filteredIds.map(id => api.delete(`/api/v1/admin/users/${id}`))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success++;
      } else {
        failed++;
        errors.push(`用户 ${filteredIds[index]} 删除失败`);
      }
    });

    return { success, failed, errors };
  },
};

// Showcase API
export const showcaseApi = {
  /**
   * 获取公开展示的项目列表（无需认证）
   * @param params 查询参数（分页、筛选、排序）
   */
  getProjects: async (params?: GetProjectsParams): Promise<ProjectsListResponse> => {
    const response = await api.get<ApiResponse<ProjectsListResponse>>('/api/v1/showcase/projects', {
      params,
    });
    return response.data.data;
  },

  /**
   * 获取单个项目详情（无需认证）
   * @param id 项目 ID
   */
  getProjectById: async (id: string): Promise<ProjectDetail> => {
    const response = await api.get<ApiResponse<ProjectDetail>>(
      `/api/v1/showcase/projects/${id}`
    );
    return response.data.data;
  },

  /**
   * 获取相关项目推荐（无需认证）
   * @param id 当前项目 ID
   */
  getRelatedProjects: async (id: string): Promise<RelatedProjectsResponse> => {
    const response = await api.get<ApiResponse<RelatedProjectsResponse>>(
      `/api/v1/showcase/projects/${id}/related`
    );
    return response.data.data;
  },
};
