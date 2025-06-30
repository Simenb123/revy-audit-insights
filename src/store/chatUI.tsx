import React, { createContext, useContext } from 'react'

interface ChatUIState {
  collapsed: boolean
  toggle(): void
}

const ChatUIContext = createContext<ChatUIState | undefined>(undefined)

export const ChatUIProvider = ({ children }: { children: React.ReactNode }) => {
  const collapsed = false
  const toggle = () => {}

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
