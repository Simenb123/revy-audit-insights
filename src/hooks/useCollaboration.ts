import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CollaboratorUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  cursor_position?: { x: number; y: number } | null;
  last_seen: string;
  is_active: boolean;
}

export interface Comment {
  id: string;
  content: string;
  widget_id: string | null;
  user_id: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  parent_comment_id: string | null;
  resolved: boolean;
  resolved_by_user_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export interface DashboardVersion {
  id: string;
  version_number: number;
  created_by_user_id: string;
  created_by_user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  widgets_data: any;
  layouts_data: any;
  settings_data: any;
  version_name: string | null;
  description: string | null;
  created_at: string;
}

export function useCollaboration(dashboardId: string, clientId: string, fiscalYear: number) {
  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<DashboardVersion[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Setup real-time collaboration
  useEffect(() => {
    if (!currentUser) return;

    const channelName = `dashboard:${dashboardId}:${clientId}:${fiscalYear}`;
    const newChannel = supabase.channel(channelName);

    // Track user presence
    const trackPresence = async () => {
      await newChannel.track({
        user_id: currentUser.id,
        display_name: currentUser.user_metadata?.display_name || currentUser.email,
        avatar_url: currentUser.user_metadata?.avatar_url,
        timestamp: new Date().toISOString()
      });
    };

    // Listen to presence changes
    newChannel
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        const users: CollaboratorUser[] = [];
        
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          presences.forEach(presence => {
            if (presence.user_id !== currentUser.id) {
              users.push({
                id: presence.user_id,
                display_name: presence.display_name,
                avatar_url: presence.avatar_url,
                email: null,
                cursor_position: presence.cursor_position,
                last_seen: presence.timestamp,
                is_active: true
              });
            }
          });
        });
        
        setCollaborators(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('New user joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      });

    // Listen to database changes
    newChannel
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'dashboard_comments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchComments();
          } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchComments();
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'dashboard_versions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchVersions();
          }
        }
      );

    newChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await trackPresence();
      }
    });

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        newChannel.unsubscribe();
      }
    };
  }, [dashboardId, clientId, fiscalYear, currentUser]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('dashboard_comments')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .eq('client_id', clientId)
      .eq('fiscal_year', fiscalYear)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Group comments by parent/child relationship (simplified without user data for now)
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data.forEach(comment => {
        const processedComment: Comment = {
          ...comment,
          user: { display_name: null, avatar_url: null },
          replies: []
        };
        commentMap.set(comment.id, processedComment);

        if (!comment.parent_comment_id) {
          rootComments.push(processedComment);
        }
      });

      // Add replies to parent comments
      data.forEach(comment => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          const child = commentMap.get(comment.id);
          if (parent && child) {
            parent.replies = parent.replies || [];
            parent.replies.push(child);
          }
        }
      });

      setComments(rootComments);
    }
  }, [dashboardId, clientId, fiscalYear]);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    const { data, error } = await supabase
      .from('dashboard_versions')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .eq('client_id', clientId)
      .eq('fiscal_year', fiscalYear)
      .order('version_number', { ascending: false });

    if (!error && data) {
      // Simplified version processing without user data for now
      const processedVersions = data.map(version => ({
        ...version,
        created_by_user: { display_name: null as string | null, avatar_url: null as string | null }
      }));
      setVersions(processedVersions);
    }
  }, [dashboardId, clientId, fiscalYear]);

  // Initial data fetch
  useEffect(() => {
    fetchComments();
    fetchVersions();
  }, [fetchComments, fetchVersions]);

  // Update cursor position
  const updateCursorPosition = useCallback((x: number, y: number) => {
    if (channel) {
      channel.track({
        user_id: currentUser?.id,
        cursor_position: { x, y },
        timestamp: new Date().toISOString()
      });
    }
  }, [channel, currentUser]);

  // Add comment
  const addComment = useCallback(async (content: string, widgetId?: string, parentCommentId?: string) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('dashboard_comments')
      .insert({
        dashboard_id: dashboardId,
        client_id: clientId,
        fiscal_year: fiscalYear,
        widget_id: widgetId || null,
        user_id: currentUser.id,
        content,
        parent_comment_id: parentCommentId || null
      });

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, [dashboardId, clientId, fiscalYear, currentUser]);

  // Resolve comment
  const resolveComment = useCallback(async (commentId: string) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('dashboard_comments')
      .update({
        resolved: true,
        resolved_by_user_id: currentUser.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (error) {
      console.error('Error resolving comment:', error);
      throw error;
    }
  }, [currentUser]);

  // Create version
  const createVersion = useCallback(async (
    widgets: any, 
    layouts: any, 
    settings: any, 
    versionName?: string, 
    description?: string
  ) => {
    if (!currentUser) return;

    // Get the next version number
    const { data: latestVersion } = await supabase
      .from('dashboard_versions')
      .select('version_number')
      .eq('dashboard_id', dashboardId)
      .eq('client_id', clientId)
      .eq('fiscal_year', fiscalYear)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersionNumber = (latestVersion?.[0]?.version_number || 0) + 1;

    const { error } = await supabase
      .from('dashboard_versions')
      .insert({
        dashboard_id: dashboardId,
        client_id: clientId,
        fiscal_year: fiscalYear,
        version_number: nextVersionNumber,
        created_by_user_id: currentUser.id,
        widgets_data: widgets,
        layouts_data: layouts,
        settings_data: settings,
        version_name: versionName,
        description
      });

    if (error) {
      console.error('Error creating version:', error);
      throw error;
    }

    return nextVersionNumber;
  }, [dashboardId, clientId, fiscalYear, currentUser]);

  return {
    collaborators,
    comments,
    versions,
    currentUser,
    updateCursorPosition,
    addComment,
    resolveComment,
    createVersion,
    refetch: {
      comments: fetchComments,
      versions: fetchVersions
    }
  };
}