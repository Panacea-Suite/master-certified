import React from 'react';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';

interface AdminShellProps {
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};