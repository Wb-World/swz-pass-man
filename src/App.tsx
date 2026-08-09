import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { PasswordProvider } from '@/context/PasswordContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { TwoFactorPage } from '@/pages/TwoFactorPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PasswordsPage } from '@/pages/PasswordsPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { SitesPage } from '@/pages/SitesPage';
import { OurMailsPage } from '@/pages/OurMailsPage';
import { ApiKeysPage } from '@/pages/ApiKeysPage';
import { AdminPage } from '@/pages/AdminPage';

import { ThemeProvider } from '@/context/ThemeContext';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PasswordProvider>
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1f2e',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
              success: {
                iconTheme: { primary: '#4f63f0', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/2fa" element={<TwoFactorPage />} />

            {/* Protected */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/passwords"  element={<PasswordsPage />} />
              <Route path="/favorites"  element={<FavoritesPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/settings"   element={<SettingsPage />} />
              <Route path="/employees"  element={<EmployeesPage />} />
              <Route path="/sites"      element={<SitesPage />} />
              <Route path="/our-mails"  element={<OurMailsPage />} />
              <Route path="/api-keys"   element={<ApiKeysPage />} />

              {/* Admin-only route */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
            </Route>

            {/* Default redirect */}
            <Route path="/"  element={<Navigate to="/sites" replace />} />
            <Route path="*"  element={<Navigate to="/sites" replace />} />
          </Routes>
        </PasswordProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
}

export default App;
