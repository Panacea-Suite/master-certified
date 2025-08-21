import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CustomerShell } from '@/components/shells/CustomerShell';
import { TestFlowGate } from '@/pages/TestFlowGate';
import { CustomerFlowRun } from '@/pages/CustomerFlowRun';
import NotFound from '@/pages/NotFound';

export const CustomerApp: React.FC = () => {
  return (
    <CustomerShell>
      <Routes>
        <Route path="/flow/test" element={<TestFlowGate />} />
        <Route path="/flow/run" element={<CustomerFlowRun />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </CustomerShell>
  );
};