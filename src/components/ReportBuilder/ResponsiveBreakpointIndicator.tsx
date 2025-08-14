import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Monitor, Tablet, Smartphone, MonitorSpeaker } from 'lucide-react';

export function ResponsiveBreakpointIndicator() {
  const isMobile = useIsMobile();
  
  // Simple breakpoint detection using window width
  const [breakpoint, setBreakpoint] = React.useState('XL');
  
  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 480) setBreakpoint('XS');
      else if (width < 768) setBreakpoint('SM');
      else if (width < 996) setBreakpoint('MD');
      else if (width < 1200) setBreakpoint('LG');
      else setBreakpoint('XL');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getCurrentBreakpoint = () => {
    switch (breakpoint) {
      case 'XS': return { name: 'XS', icon: Smartphone, color: 'destructive' };
      case 'SM': return { name: 'SM', icon: Smartphone, color: 'secondary' };
      case 'MD': return { name: 'MD', icon: Tablet, color: 'default' };
      case 'LG': return { name: 'LG', icon: Monitor, color: 'default' };
      default: return { name: 'XL', icon: MonitorSpeaker, color: 'default' };
    }
  };

  const { name, icon: Icon, color } = getCurrentBreakpoint();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Badge variant={color as any} className="text-xs">
        <Icon className="w-3 h-3 mr-1" />
        {name}
      </Badge>
    </div>
  );
}