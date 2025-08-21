import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminShell } from '@/components/shells/AdminShell';
import AdminIndex from '@/pages/AdminIndex';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import NotFound from '@/pages/NotFound';

export const AdminApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <AdminShell>
          <AdminIndex />
        </AdminShell>
      } />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={
        <AdminShell>
          <NotFound />
        </AdminShell>
      } />
    </Routes>
  );
};