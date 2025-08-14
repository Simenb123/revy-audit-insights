import React from 'react';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeAnalysisEvent {
  type: 'analysis_started' | 'analysis_progress' | 'analysis_completed' | 'analysis_error';
  sessionId: string;
  clientId: string;
  analysisType: string;
  data: any;
  timestamp: Date;
}

interface SubscriptionOptions {
  onAnalysisStarted?: (event: RealtimeAnalysisEvent) => void;
  onAnalysisProgress?: (event: RealtimeAnalysisEvent) => void;
  onAnalysisCompleted?: (event: RealtimeAnalysisEvent) => void;
  onAnalysisError?: (event: RealtimeAnalysisEvent) => void;
}

export class RealtimeAnalysisService {
  private subscriptions: Map<string, any> = new Map();
  private eventHandlers: Map<string, SubscriptionOptions> = new Map();

  /**
   * Subscribe to real-time analysis updates for a specific client
   */
  subscribeToClientAnalysis(clientId: string, options: SubscriptionOptions): string {
    const subscriptionId = `client_${clientId}_${Date.now()}`;
    
    try {
      // Create Supabase real-time subscription
      const subscription = supabase
        .channel(`analysis_${clientId}`)
        .on('broadcast', { event: 'analysis_update' }, (payload) => {
          this.handleRealtimeEvent(subscriptionId, payload);
        })
        .subscribe();

      this.subscriptions.set(subscriptionId, subscription);
      this.eventHandlers.set(subscriptionId, options);

      logger.log(`✅ Subscribed to real-time analysis updates for client: ${clientId}`);
      return subscriptionId;

    } catch (error) {
      logger.error('❌ Failed to subscribe to real-time analysis:', error);
      throw error;
    }
  }

  /**
   * Subscribe to global analysis events (all clients)
   */
  subscribeToGlobalAnalysis(options: SubscriptionOptions): string {
    const subscriptionId = `global_${Date.now()}`;
    
    try {
      const subscription = supabase
        .channel('global_analysis')
        .on('broadcast', { event: 'global_analysis_update' }, (payload) => {
          this.handleRealtimeEvent(subscriptionId, payload);
        })
        .subscribe();

      this.subscriptions.set(subscriptionId, subscription);
      this.eventHandlers.set(subscriptionId, options);

      logger.log('✅ Subscribed to global real-time analysis updates');
      return subscriptionId;

    } catch (error) {
      logger.error('❌ Failed to subscribe to global analysis:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): void {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        supabase.removeChannel(subscription);
        this.subscriptions.delete(subscriptionId);
        this.eventHandlers.delete(subscriptionId);
        logger.log(`✅ Unsubscribed from real-time analysis: ${subscriptionId}`);
      }
    } catch (error) {
      logger.error('❌ Failed to unsubscribe from real-time analysis:', error);
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    for (const subscriptionId of this.subscriptions.keys()) {
      this.unsubscribe(subscriptionId);
    }
  }

  /**
   * Broadcast analysis event to subscribers
   */
  async broadcastAnalysisEvent(
    clientId: string, 
    event: Omit<RealtimeAnalysisEvent, 'timestamp'>
  ): Promise<void> {
    try {
      const eventWithTimestamp: RealtimeAnalysisEvent = {
        ...event,
        timestamp: new Date()
      };

      // Broadcast to client-specific channel
      await supabase
        .channel(`analysis_${clientId}`)
        .send({
          type: 'broadcast',
          event: 'analysis_update',
          payload: eventWithTimestamp
        });

      // Broadcast to global channel
      await supabase
        .channel('global_analysis')
        .send({
          type: 'broadcast',
          event: 'global_analysis_update',
          payload: eventWithTimestamp
        });

      logger.log(`📡 Broadcasted analysis event: ${event.type} for client: ${clientId}`);

    } catch (error) {
      logger.error('❌ Failed to broadcast analysis event:', error);
    }
  }

  /**
   * Handle incoming real-time events
   */
  private handleRealtimeEvent(subscriptionId: string, payload: any): void {
    try {
      const handlers = this.eventHandlers.get(subscriptionId);
      if (!handlers) return;

      const event: RealtimeAnalysisEvent = payload.payload || payload;
      
      switch (event.type) {
        case 'analysis_started':
          handlers.onAnalysisStarted?.(event);
          break;
        case 'analysis_progress':
          handlers.onAnalysisProgress?.(event);
          break;
        case 'analysis_completed':
          handlers.onAnalysisCompleted?.(event);
          break;
        case 'analysis_error':
          handlers.onAnalysisError?.(event);
          break;
        default:
          logger.warn('Unknown real-time event type:', event.type);
      }

    } catch (error) {
      logger.error('❌ Failed to handle real-time event:', error);
    }
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptions(): number {
    return this.subscriptions.size;
  }

  /**
   * Get subscription details
   */
  getSubscriptionInfo(): Array<{ id: string; type: string; }> {
    return Array.from(this.subscriptions.keys()).map(id => ({
      id,
      type: id.startsWith('global_') ? 'global' : 'client-specific'
    }));
  }
}

// Export singleton instance
export const realtimeAnalysisService = new RealtimeAnalysisService();

// Helper hook for React components
export function useRealtimeAnalysis(
  clientId?: string,
  options: SubscriptionOptions = {}
) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [subscriptionId, setSubscriptionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let id: string;

    try {
      if (clientId) {
        id = realtimeAnalysisService.subscribeToClientAnalysis(clientId, {
          ...options,
          onAnalysisStarted: (event) => {
            setIsConnected(true);
            options.onAnalysisStarted?.(event);
          },
          onAnalysisCompleted: (event) => {
            options.onAnalysisCompleted?.(event);
          },
          onAnalysisError: (event) => {
            options.onAnalysisError?.(event);
          }
        });
      } else {
        id = realtimeAnalysisService.subscribeToGlobalAnalysis(options);
      }

      setSubscriptionId(id);
      setIsConnected(true);

    } catch (error) {
      logger.error('Failed to setup real-time analysis subscription:', error);
      setIsConnected(false);
    }

    return () => {
      if (id) {
        realtimeAnalysisService.unsubscribe(id);
        setIsConnected(false);
        setSubscriptionId(null);
      }
    };
  }, [clientId]);

  return {
    isConnected,
    subscriptionId,
    disconnect: () => {
      if (subscriptionId) {
        realtimeAnalysisService.unsubscribe(subscriptionId);
        setIsConnected(false);
        setSubscriptionId(null);
      }
    }
  };
}