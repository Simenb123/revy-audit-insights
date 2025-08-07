import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface RecentClient {
  id: string;
  name: string;
  orgNumber?: string;
  lastVisited: string;
  url: string;
}

const MAX_RECENT_CLIENTS = 10;
const STORAGE_EXPIRY_DAYS = 30;

export const useRecentClients = () => {
  const { session } = useAuth();
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);

  const storageKey = `recent_clients_${session?.user?.id || 'anonymous'}`;

  const loadRecentClients = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const clients: RecentClient[] = JSON.parse(stored);
        const now = new Date();
        const validClients = clients.filter(client => {
          const visitDate = new Date(client.lastVisited);
          const daysDiff = (now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= STORAGE_EXPIRY_DAYS;
        });
        setRecentClients(validClients.slice(0, MAX_RECENT_CLIENTS));
      }
    } catch (error) {
      console.error('Error loading recent clients:', error);
      setRecentClients([]);
    }
  }, [storageKey]);

  const saveRecentClients = useCallback((clients: RecentClient[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(clients));
    } catch (error) {
      console.error('Error saving recent clients:', error);
    }
  }, [storageKey]);

  const addRecentClient = useCallback((client: Omit<RecentClient, 'lastVisited'>) => {
    const now = new Date().toISOString();
    const newClient: RecentClient = { ...client, lastVisited: now };
    
    setRecentClients(prev => {
      const filtered = prev.filter(c => c.id !== client.id);
      const updated = [newClient, ...filtered].slice(0, MAX_RECENT_CLIENTS);
      saveRecentClients(updated);
      window.dispatchEvent(new Event('recent-clients-updated'));
      return updated;
    });
  }, [saveRecentClients]);

  const clearHistory = useCallback(() => {
    setRecentClients([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing recent clients:', error);
    }
  }, [storageKey]);

  useEffect(() => {
    loadRecentClients();
  }, [loadRecentClients]);

  useEffect(() => {
    const handleUpdate = () => loadRecentClients();
    window.addEventListener('recent-clients-updated', handleUpdate);
    return () => {
      window.removeEventListener('recent-clients-updated', handleUpdate);
    };
  }, [loadRecentClients]);

  return {
    recentClients,
    addRecentClient,
    clearHistory
  };
};