
import React from 'react';

interface OnboardingCheckProps {
  children?: React.ReactNode;
}

const OnboardingCheck: React.FC<OnboardingCheckProps> = ({ children }) => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Fullfør profilen din</h2>
        <p className="text-muted-foreground mb-4">
          Vennligst fyll ut profilen din for å komme i gang.
        </p>
        {children}
      </div>
    </div>
  );
};

export default OnboardingCheck;
