
import * as React from 'react';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // Define the check function
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Run initial check
    checkIfMobile();
    
    // Set up event listener for window resizing
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return isMobile;
}
