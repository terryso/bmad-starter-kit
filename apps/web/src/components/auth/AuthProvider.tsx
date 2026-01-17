import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';

/**
 * AuthProvider Component
 *
 * 在应用加载时自动使用 refresh token cookie 刷新 access token。
 * 实现登录会话 7 天持久化，刷新页面不会退出登录。
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refreshAuth, setAuth, _hasHydrated } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 等待 Zustand persist 完成 rehydration
    if (!_hasHydrated) return;
    // 只执行一次
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // 初始化认证状态
    const initAuth = async () => {
      const storedAuth = localStorage.getItem('auth-storage');
      let hasStoredUser = false;

      if (storedAuth) {
        try {
          const { state: storedState } = JSON.parse(storedAuth);
          hasStoredUser = !!storedState?.user;
        } catch (e) {
          // 解析错误，清除无效数据
          localStorage.removeItem('auth-storage');
        }
      }

      // 如果 localStorage 中有用户数据，尝试用 refresh token 刷新 access token
      if (hasStoredUser) {
        const success = await refreshAuth();
        if (!success) {
          // Refresh token 无效或过期，清除认证状态
          localStorage.removeItem('auth-storage');
          setAuth(null, null);
        }
      }
    };

    initAuth();
  }, [_hasHydrated, refreshAuth, setAuth]);

  return <>{children}</>;
}
