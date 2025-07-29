import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      (main as HTMLElement).scrollTo({ top: 0 });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
