import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@cuplayer/shared';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean; // 内部使用：标记是否已完成从 localStorage 恢复
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  _setHasHydrated: () => void;
  getAccessToken: () => string | null;
  /**
   * 使用 refresh token 刷新 access token
   * 在页面加载时自动调用（如果有 refresh token cookie）
   */
  refreshAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAuth: (user, accessToken) => {
        set({
          user,
          accessToken,
          isAuthenticated: true,
          _hasHydrated: true,
        });
      },
      setUser: (user) => {
        set({
          user,
          isAuthenticated: true,
        });
      },
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },
      _setHasHydrated: () => {
        set({ _hasHydrated: true });
      },
      getAccessToken: () => {
        return get().accessToken;
      },
      refreshAuth: async () => {
        try {
          const response = await authApi.refreshToken();
          if (response.statusCode === 200 && response.data) {
            set({
              user: response.data.user,
              accessToken: response.data.accessToken,
              isAuthenticated: true,
            });
            return true;
          }
          return false;
        } catch (error) {
          // Refresh token 无效或过期，清除认证状态
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken, // 持久化 accessToken，避免刷新时 401
      }),
      onRehydrateStorage: () => () => {
        // rehydration 完成后设置标记
        useAuthStore.getState()._setHasHydrated();
      },
    }
  )
);

// 确保 _hasHydrated 最终会被设置（兜底逻辑）
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useAuthStore.getState()._hasHydrated) {
      useAuthStore.getState()._setHasHydrated();
    }
  }, 100);
}
