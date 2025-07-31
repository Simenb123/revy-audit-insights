import React from 'react';
import ClientContextHeader from './ClientContextHeader';

interface StickyClientLayoutProps {
  clientName: string;
  orgNumber?: string;
  pageTitle: string;
  showBackButton?: boolean;
  children: React.ReactNode;
}

const StickyClientLayout: React.FC<StickyClientLayoutProps> = ({
  clientName,
  orgNumber,
  pageTitle,
  showBackButton = true,
  children
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      <ClientContextHeader 
        clientName={clientName}
        orgNumber={orgNumber}
        pageTitle={pageTitle}
        showBackButton={showBackButton}
      />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default StickyClientLayout;