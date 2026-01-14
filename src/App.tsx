import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
import Login from '@/pages/Login';
import MasterCompanies from '@/pages/master/Companies';
import CompanyDashboard from '@/pages/company/Dashboard';
import CompanyDraws from '@/pages/company/Draws';
import CompanyNewDraw from '@/pages/company/NewDraw';
import CompanyExecuteDraw from '@/pages/company/ExecuteDraw';
import CompanyUsers from '@/pages/company/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Login geral */}
            <Route path="/login" element={<Login />} />
            
            {/* Login por empresa */}
            <Route path="/:companySlug/login" element={<Login />} />
            
            {/* Área Master */}
            <Route
              path="/master/companies"
              element={
                <ProtectedRoute requireMaster>
                  <MasterCompanies />
                </ProtectedRoute>
              }
            />
            
            {/* Área da Empresa */}
            <Route
              path="/:companySlug/dashboard"
              element={
                <ProtectedRoute>
                  <CompanyDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/:companySlug/draws"
              element={
                <ProtectedRoute>
                  <CompanyDraws />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/:companySlug/draws/new"
              element={
                <ProtectedRoute>
                  <CompanyNewDraw />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/:companySlug/draws/:drawId/execute"
              element={
                <ProtectedRoute>
                  <CompanyExecuteDraw />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/:companySlug/users"
              element={
                <ProtectedRoute>
                  <CompanyUsers />
                </ProtectedRoute>
              }
            />
            
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
