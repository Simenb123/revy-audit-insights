import { useState, useEffect } from 'react'

const LG_BREAKPOINT = 1024

export function useBreakpoint() {
  const [isLg, setIsLg] = useState(() => typeof window !== 'undefined' && window.innerWidth >= LG_BREAKPOINT)

  useEffect(() => {
    const handleResize = () => {
      setIsLg(window.innerWidth >= LG_BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return { lg: isLg }
}
