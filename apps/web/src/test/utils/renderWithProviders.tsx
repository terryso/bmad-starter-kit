import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withRouter?: boolean;
  queryClient?: QueryClient;
}

/**
 * Render component with necessary providers
 *
 * Wraps components with:
 * - QueryClientProvider for React Query
 * - BrowserRouter for routing (if withRouter is true)
 *
 * @param component - React component to render
 * @param options - Render options
 * @returns Render result
 */
export function renderWithProviders(
  component: ReactElement,
  options: ExtendedRenderOptions = {}
) {
  const { withRouter = false, queryClient, ...renderOptions } = options;

  // Create QueryClient if not provided
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Reset auth store to default state before each render
  useAuthStore.getState().clearAuth();

  const wrappers: ReactElement[] = [
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>,
  ];

  // Add BrowserRouter if requested
  if (withRouter) {
    wrappers.unshift(<BrowserRouter>{wrappers.pop()}</BrowserRouter>);
  }

  return render(component, {
    ...renderOptions,
    wrapper: ({ children }) => (
      <>{children}</>
    ),
  });
}
