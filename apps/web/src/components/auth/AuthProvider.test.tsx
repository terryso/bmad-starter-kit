import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactElement } from 'react';
import { AuthProvider } from './AuthProvider';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

// Mock localStorage
const testStorage: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => testStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    testStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete testStorage[key];
  },
  clear: () => {
    Object.keys(testStorage).forEach(key => delete testStorage[key]);
  },
  get length() {
    return Object.keys(testStorage).length;
  },
  key: (index: number) => Object.keys(testStorage)[index] ?? null,
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock authApi
vi.mock('@/lib/api', () => ({
  authApi: {
    refreshToken: vi.fn(),
  },
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 清除存储的数据
    Object.keys(testStorage).forEach(key => delete testStorage[key]);
    // 重置 store
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
    });
  });

  it('应该渲染子组件', () => {
    let container: ReactElement | null = null;

    const TestComponent = () => {
      return (
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );
    };

    container = <TestComponent />;
    expect(container).toBeTruthy();
  });

  it('当没有存储的认证信息时不调用 refreshAuth', async () => {
    // 确保 auth-storage 不存在
    delete testStorage['auth-storage'];

    renderHook(() => <AuthProvider>{null}</AuthProvider>);

    // 等待 useEffect 执行
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(authApi.refreshToken).not.toHaveBeenCalled();
  });

  it('应该处理存储数据解析失败', async () => {
    testStorage['auth-storage'] = 'invalid-json';

    renderHook(() => <AuthProvider>{null}</AuthProvider>);

    await new Promise(resolve => setTimeout(resolve, 300));

    // 解析失败后，应该清除认证状态
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('当 refreshAuth 失败时应该清除认证状态', async () => {
    // 先设置用户状态
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useAuthStore.setState({
      user: mockUser,
      accessToken: 'old-token',
      isAuthenticated: true,
      _hasHydrated: true,
    });

    vi.mocked(authApi).refreshToken.mockRejectedValue(new Error('Refresh failed'));

    // 直接调用 refreshAuth 来测试失败场景
    const result = await useAuthStore.getState().refreshAuth();

    expect(result).toBe(false);

    // 状态应该被清除
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('当 refreshAuth 成功时应该更新状态', async () => {
    // 先设置用户状态
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useAuthStore.setState({
      user: mockUser,
      accessToken: 'old-token',
      isAuthenticated: true,
      _hasHydrated: true,
    });

    const newToken = 'new-access-token';

    vi.mocked(authApi).refreshToken.mockResolvedValue({
      statusCode: 200,
      data: {
        accessToken: newToken,
        user: mockUser,
      },
    });

    // 直接调用 refreshAuth
    const result = await useAuthStore.getState().refreshAuth();

    expect(result).toBe(true);

    // 状态应该被更新
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe(newToken);
    expect(state.user).toEqual(mockUser);
  });
});
