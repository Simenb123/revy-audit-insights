import { useState, useEffect } from 'react'

interface ImportSession {
  sessionId: string
  year: number
  isGlobal: boolean
  fileName: string
  startedAt: number
  status: 'active' | 'completed' | 'failed'
  totalRows?: number
  processedRows?: number
}

const STORAGE_KEY = 'revio_import_sessions'

export function useSessionStorage() {
  const [sessions, setSessions] = useState<ImportSession[]>([])

  useEffect(() => {
    // Load sessions from localStorage
    const storedSessions = localStorage.getItem(STORAGE_KEY)
    if (storedSessions) {
      try {
        setSessions(JSON.parse(storedSessions))
      } catch (error) {
        console.error('Failed to parse stored sessions:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const saveSession = (session: ImportSession) => {
    const updatedSessions = [...sessions.filter(s => s.sessionId !== session.sessionId), session]
    setSessions(updatedSessions)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
  }

  const updateSessionStatus = (sessionId: string, updates: Partial<ImportSession>) => {
    const updatedSessions = sessions.map(session => 
      session.sessionId === sessionId 
        ? { ...session, ...updates }
        : session
    )
    setSessions(updatedSessions)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
  }

  const getActiveSession = (year: number, isGlobal: boolean): ImportSession | null => {
    return sessions.find(s => 
      s.year === year && 
      s.isGlobal === isGlobal && 
      s.status === 'active'
    ) || null
  }

  const clearOldSessions = () => {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    const activeSessions = sessions.filter(s => s.startedAt > oneDayAgo)
    setSessions(activeSessions)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSessions))
  }

  return {
    sessions,
    saveSession,
    updateSessionStatus,
    getActiveSession,
    clearOldSessions
  }
}