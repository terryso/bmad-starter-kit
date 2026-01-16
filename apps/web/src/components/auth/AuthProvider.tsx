import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';

/**
 * AuthProvider Component
 *
 * Automatically refreshes the access token on app load using the refresh token cookie.
 * This enables persistent login sessions for 7 days.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refreshAuth, setAuth, user } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 只执行一次
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // 延迟执行，确保 Zustand persist 已经完成 rehydration
    const initAuth = async () => {
      // 等待一小段时间确保 localStorage 已读取
      await new Promise(resolve => setTimeout(resolve, 100));

      const storedAuth = localStorage.getItem('auth-storage');
      if (storedAuth) {
        try {
          const { state: storedState } = JSON.parse(storedAuth);
          // 有用户数据，尝试用 refresh token 恢复 access token
          if (storedState?.user) {
            const success = await refreshAuth();
            if (!success) {
              // Refresh 失败，清除认证状态
              setAuth(null, null);
            }
          }
        } catch (e) {
          // 解析错误，清除认证状态
          setAuth(null, null);
        }
      }
    };

    initAuth();
  }, []); // 空依赖数组，只在挂载时执行一次

  return <>{children}</>;
}
