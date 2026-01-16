import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { setupMockServer } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/utils/renderWithProviders';
import { LoginForm } from './LoginForm';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

// 设置 MSW server
setupMockServer();

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    // 重置 auth store
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
    });
  });

  const renderForm = () => {
    return renderWithProviders(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LoginForm />
      </MemoryRouter>,
      { withRouter: false } // 避免嵌套 Router
    );
  };

  describe('渲染', () => {
    it('应该渲染登录表单', () => {
      renderForm();

      expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();
      expect(screen.getByText('输入您的邮箱和密码登录账户')).toBeInTheDocument();
    });

    it('应该渲染邮箱输入框', () => {
      renderForm();

      expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    });

    it('应该渲染密码输入框', () => {
      renderForm();

      expect(screen.getByLabelText('密码')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('应该渲染登录按钮', () => {
      renderForm();

      const submitButton = screen.getByRole('button', { name: '登录' });
      expect(submitButton).toBeInTheDocument();
    });

    it('应该渲染注册链接', () => {
      renderForm();

      expect(screen.getByText('还没有账号？')).toBeInTheDocument();
      expect(screen.getByText('去注册')).toBeInTheDocument();
    });
  });

  describe('表单验证', () => {
    it('应该验证邮箱格式', async () => {
      const user = userEvent.setup();
      renderForm();

      const emailInput = screen.getByLabelText('邮箱');
      const submitButton = screen.getByRole('button', { name: '登录' });

      await user.click(submitButton);

      // 等待验证错误显示
      await waitFor(() => {
        expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
      });

      // 输入无效邮箱
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
      });
    });

    it('应该验证密码长度', async () => {
      const user = userEvent.setup();
      renderForm();

      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });

      await user.type(passwordInput, '1234567'); // 少于 8 位
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('密码至少需要 8 位')).toBeInTheDocument();
      });
    });
  });

  describe('登录功能', () => {
    it('应该成功登录并跳转到首页', async () => {
      const user = userEvent.setup();
      renderForm();

      const emailInput = screen.getByLabelText('邮箱');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });

      // MSW mock 配置了 test@example.com / password123 会成功
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('登录成功');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/');

      // 验证 auth store 被更新
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user).toBeTruthy();
      expect(authState.accessToken).toBe('mock-access-token');
    });

    it('登录失败时应该显示错误信息', async () => {
      const user = userEvent.setup();
      renderForm();

      const emailInput = screen.getByLabelText('邮箱');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });

      // 错误凭证
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('登录时应该显示加载状态', async () => {
      const user = userEvent.setup();
      renderForm();

      const emailInput = screen.getByLabelText('邮箱');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // 点击提交
      await user.click(submitButton);

      // 按钮应该显示加载状态
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '登录中...' })).toBeInTheDocument();
      });
    });

    it('加载时应该禁用输入框', async () => {
      const user = userEvent.setup();
      renderForm();

      const emailInput = screen.getByLabelText('邮箱');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // 输入框应该被禁用
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });
    });
  });
});
