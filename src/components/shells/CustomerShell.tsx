import React from 'react';

interface CustomerShellProps {
  children: React.ReactNode;
}

export const CustomerShell: React.FC<CustomerShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {children}
    </div>
  );
};