
import { logger } from '@/utils/logger';
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, checkSupabaseConnection } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  connectionStatus: 'checking' | 'connected' | 'disconnected';
}

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  user: null, 
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
  connectionStatus: 'checking'
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const refreshSession = async () => {
    if (!isSupabaseConfigured || !supabase) {
      logger.warn('⚠️ Supabase not configured. Skipping session refresh.');
      return;
    }
    try {
      logger.log('🔄 Refreshing session...');
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();
      if (error) {
        logger.error('❌ Error refreshing session:', error);
      } else {
        logger.log('✅ Session refreshed successfully');
        setSession(session);
        setUser(session?.user ?? null);
      }
    } catch (error) {
      logger.error('❌ Failed to refresh session:', error);
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      logger.warn('⚠️ Supabase not configured. Clearing local session.');
      setSession(null);
      setUser(null);
      return;
    }
    try {
      logger.log('🚪 Signing out...');
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      logger.log('✅ Signed out successfully');
    } catch (error) {
      logger.error('❌ Error signing out:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        logger.error('❌ Supabase not configured. Cannot initialize authentication.');
        setConnectionStatus('disconnected');
        setIsLoading(false);
        return;
      }

      // Check connection first
      const connected = await checkSupabaseConnection();
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      
      if (!connected) {
        logger.error('❌ Supabase connection failed');
        setIsLoading(false);
        return;
      }

      // Set up auth state listener
      logger.log('🔧 Setting up auth state listener...');
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        logger.log('🔐 Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id?.substring(0, 8) || 'none'
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Auto-refresh session if it's about to expire
        if (session && event === 'SIGNED_IN') {
          logger.log('⏰ Setting up auto-refresh timer...');
          setTimeout(refreshSession, 1000 * 60 * 50); // Refresh 10 minutes before expiry
        }
      });

      // Check for existing session
      try {
        logger.log('🔍 Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          logger.error('❌ Error getting session:', error);
        } else {
          logger.log('📋 Session check result:', {
            hasSession: !!session,
            userId: session?.user?.id?.substring(0, 8) || 'none'
          });
        }
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        logger.error('❌ Failed to get session:', error);
      } finally {
        setIsLoading(false);
      }

      return () => {
        logger.log('🧹 Cleaning up auth subscription...');
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      signOut, 
      refreshSession,
      connectionStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
