import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { AppLayout, RouteErrorFallback } from '@/App';
import { LoginPage } from '@/auth/LoginPage';
import { RequireAuth } from '@/auth/RequireAuth';
import { LocaleProvider } from '@/i18n';
import { createQueryClient } from '@/lib/query-client';
import { ProductDetailPage } from '@/products/ProductDetailPage';
import { ProductListPage } from '@/products/ProductListPage';
import './index.css';

const queryClient = createQueryClient();

// Data router (not declarative <Routes>): required for useBlocker (UX-003).
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    ErrorBoundary: RouteErrorFallback,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/', element: <Navigate to="/products" replace /> },
          { path: '/products', element: <ProductListPage /> },
          { path: '/products/:id', element: <ProductDetailPage /> },
          { path: '*', element: <Navigate to="/products" replace /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <RouterProvider router={router} />
      </LocaleProvider>
    </QueryClientProvider>
  </StrictMode>,
);
