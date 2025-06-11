
import React from 'react';
import RealTimeKPIs from './Widgets/RealTimeKPIs';
import IntelligentNotifications from './Widgets/IntelligentNotifications';
import RevenueAnalysis from './Widgets/RevenueAnalysis';
import FinancialRatios from './Widgets/FinancialRatios';
import ExpenseAnalysis from './Widgets/ExpenseAnalysis';
import AccountingOverview from './Widgets/AccountingOverview';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Real-time KPIs */}
      <RealTimeKPIs />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueAnalysis />
            <ExpenseAnalysis />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FinancialRatios />
            <AccountingOverview />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <IntelligentNotifications />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
