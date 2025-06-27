import React, { createContext, useContext, useEffect, useState } from 'react'

interface ChatUIState {
  collapsed: boolean
  toggle(): void
}

const ChatUIContext = createContext<ChatUIState | undefined>(undefined)

export const ChatUIProvider = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('chatUICollapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('chatUICollapsed', collapsed.toString())
  }, [collapsed])

  const toggle = () => setCollapsed(prev => !prev)

  return (
    <ChatUIContext.Provider value={{ collapsed, toggle }}>
      {children}
    </ChatUIContext.Provider>
  )
}

export const useChatUI = () => {
  const context = useContext(ChatUIContext)
  if (!context) throw new Error('useChatUI must be inside ChatUIProvider')
  return context
}
