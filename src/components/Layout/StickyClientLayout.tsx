import React from 'react';
import ClientPageHeader from './ClientPageHeader';
import ResponsiveLayout from './ResponsiveLayout';

interface StickyClientLayoutProps {
  clientName: string;
  orgNumber?: string;
  showBackButton?: boolean;
  children: React.ReactNode;
  maxWidth?: 'narrow' | 'medium' | 'wide' | 'full';
}

const StickyClientLayout: React.FC<StickyClientLayoutProps> = ({
  clientName,
  orgNumber,
  showBackButton = true,
  children,
  maxWidth = 'full'
}) => {
  return (
    <div className="flex flex-col h-screen">
      <ClientPageHeader 
        clientName={clientName}
        orgNumber={orgNumber}
        showBackButton={showBackButton}
      />
      <div className="flex-1 overflow-auto">
        <ResponsiveLayout maxWidth={maxWidth}>
          {children}
        </ResponsiveLayout>
      </div>
    </div>
  );
};

export default StickyClientLayout;