# Revio Integration Patterns

## AI Assistant Integration

### Revy Chat Context Passing
```typescript
// Context provider for AI interactions
interface AIContext {
  clientId?: string;
  documentId?: string;
  actionArea?: string;
  userId: string;
  sessionId: string;
}

// Hook for managing AI context
export const useAIContext = () => {
  const [context, setContext] = useState<AIContext>({
    userId: user?.id,
    sessionId: generateSessionId(),
  });

  const updateContext = (updates: Partial<AIContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  return { context, updateContext };
};

// Component integration
const ClientDetailsPage = ({ clientId }) => {
  const { updateContext } = useAIContext();
  
  useEffect(() => {
    updateContext({ clientId });
  }, [clientId]);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <ClientInformation />
        <DocumentList />
      </div>
      <div className="col-span-1">
        <EmbeddedRevyChat 
          context={{ 
            clientId,
            contextType: 'client_details' 
          }}
        />
      </div>
    </div>
  );
};
```

### AI-Enhanced Components Pattern
```typescript
// HOC for AI enhancement
const withAIAssistance = <T extends {}>(
  Component: React.ComponentType<T>,
  aiConfig: AIConfig
) => {
  return (props: T) => {
    const [showAI, setShowAI] = useState(false);
    const { sendMessage } = useAIChat(aiConfig.context);

    const triggerAIAssistance = async (prompt: string) => {
      setShowAI(true);
      await sendMessage(prompt);
    };

    return (
      <div className="relative">
        <Component {...props} />
        <AIAssistanceButton
          onClick={() => triggerAIAssistance(aiConfig.defaultPrompt)}
          className="absolute top-2 right-2"
        />
        {showAI && (
          <AIPanel onClose={() => setShowAI(false)} />
        )}
      </div>
    );
  };
};

// Usage
const AIEnhancedDocumentList = withAIAssistance(
  DocumentList,
  {
    context: { type: 'document_analysis' },
    defaultPrompt: 'Analyser disse dokumentene og foreslå kategorisering'
  }
);
```

## Document Processing Pipeline

### Upload to Analysis Flow
```typescript
// Document upload with AI pipeline
export const useDocumentUploadPipeline = () => {
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      // 1. Upload files to Supabase storage
      const uploadResults = await Promise.all(
        files.map(file => uploadToStorage(file))
      );

      // 2. Create document records
      const { data: documents } = await supabase
        .from('client_documents_files')
        .insert(
          uploadResults.map(result => ({
            file_name: result.fileName,
            file_path: result.path,
            mime_type: result.mimeType,
            file_size: result.size,
            text_extraction_status: 'pending',
          }))
        )
        .select();

      // 3. Trigger text extraction pipeline
      await Promise.all(
        documents.map(doc => 
          supabase.functions.invoke('extract-document-text', {
            body: { documentId: doc.id }
          })
        )
      );

      return documents;
    },
    onSuccess: (documents) => {
      // 4. Monitor extraction progress
      documents.forEach(doc => {
        monitorDocumentProcessing(doc.id);
      });
    }
  });

  return uploadMutation;
};

// Real-time document processing monitoring
const monitorDocumentProcessing = (documentId: string) => {
  const subscription = supabase
    .channel(`document_${documentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'client_documents_files',
        filter: `id=eq.${documentId}`
      },
      (payload) => {
        if (payload.new.text_extraction_status === 'completed') {
          // Trigger AI analysis
          supabase.functions.invoke('analyze-document', {
            body: { documentId }
          });
        }
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
};
```

### Batch Processing Pattern
```typescript
// Batch document operations
export const useBatchDocumentOperations = () => {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({});

  const categorizeBatch = useMutation({
    mutationFn: async (categoryId: string) => {
      const results = await Promise.allSettled(
        selectedDocuments.map(async (docId, index) => {
          setBatchProgress(prev => ({
            ...prev,
            [docId]: { status: 'processing', progress: 0 }
          }));

          const result = await supabase
            .from('client_documents_files')
            .update({ category_id: categoryId })
            .eq('id', docId);

          setBatchProgress(prev => ({
            ...prev,
            [docId]: { status: 'completed', progress: 100 }
          }));

          return result;
        })
      );

      return results;
    }
  });

  return {
    selectedDocuments,
    setSelectedDocuments,
    batchProgress,
    categorizeBatch: categorizeBatch.mutate,
    isProcessing: categorizeBatch.isPending
  };
};
```

## Client Data Management

### Client Context Provider
```typescript
// Global client context
const ClientContext = createContext<ClientContextType | null>(null);

export const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [clientPermissions, setClientPermissions] = useState<Permissions>({});

  // Load client permissions when client changes
  useEffect(() => {
    if (activeClient) {
      loadClientPermissions(activeClient.id);
    }
  }, [activeClient]);

  const switchClient = async (clientId: string) => {
    const client = await fetchClientData(clientId);
    setActiveClient(client);
    
    // Update AI context
    updateAIContext({ clientId });
    
    // Analytics tracking
    analytics.track('client_switched', { clientId });
  };

  return (
    <ClientContext.Provider value={{
      activeClient,
      clientPermissions,
      switchClient,
    }}>
      {children}
    </ClientContext.Provider>
  );
};

// Hook for client context
export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within ClientProvider');
  }
  return context;
};
```

### Permission-Based Rendering
```typescript
// Permission guard component
const PermissionGuard = ({ 
  permission, 
  clientId, 
  children,
  fallback = null 
}: PermissionGuardProps) => {
  const { checkPermission } = usePermissions();
  const hasPermission = checkPermission(permission, clientId);

  if (!hasPermission) {
    return fallback;
  }

  return <>{children}</>;
};

// Usage in components
const ClientActions = ({ clientId }) => {
  return (
    <div className="flex gap-2">
      <PermissionGuard permission="client.edit" clientId={clientId}>
        <Button onClick={handleEdit}>Rediger</Button>
      </PermissionGuard>
      
      <PermissionGuard permission="client.delete" clientId={clientId}>
        <Button variant="destructive" onClick={handleDelete}>
          Slett
        </Button>
      </PermissionGuard>
    </div>
  );
};
```

## Real-time Updates Pattern

### Supabase Realtime Integration
```typescript
// Real-time hook for table changes
export const useRealtimeTable = <T>(
  table: string,
  filter?: string
) => {
  const [data, setData] = useState<T[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          // Update local state
          setData(prev => {
            switch (payload.eventType) {
              case 'INSERT':
                return [...prev, payload.new as T];
              case 'UPDATE':
                return prev.map(item => 
                  (item as any).id === payload.new.id ? payload.new as T : item
                );
              case 'DELETE':
                return prev.filter(item => 
                  (item as any).id !== payload.old.id
                );
              default:
                return prev;
            }
          });

          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: [table] });
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [table, filter]);

  return data;
};

// Team collaboration updates
const useTeamUpdates = (clientId: string) => {
  const realtimeActions = useRealtimeTable(
    'audit_actions',
    `client_id=eq.${clientId}`
  );

  const realtimeComments = useRealtimeTable(
    'action_comments',
    `client_id=eq.${clientId}`
  );

  return { realtimeActions, realtimeComments };
};
```

## Error Boundary Integration

### Global Error Handling
```typescript
// Revio-specific error boundary
class RevioErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to external service
    logger.error('React Error Boundary:', { error, errorInfo });

    // Track in analytics
    analytics.track('app_error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="text-destructive">
              Noe gikk galt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              En uventet feil oppstod. Vårt team har blitt varslet.
            </p>
            <Button 
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Prøv igjen
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Query error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      onError: (error: any) => {
        logger.error('Query error:', error);
        
        // Show user-friendly error
        toast({
          title: "Feil ved lasting av data",
          description: "Prøv å laste siden på nytt",
          variant: "destructive",
        });
      }
    }
  }
});
```

## Analytics Integration

### Event Tracking Pattern
```typescript
// Analytics service
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('Analytics:', event, properties);
    }

    // Send to analytics service
    // Implementation depends on chosen service (Mixpanel, Amplitude, etc.)
  },

  page: (name: string, properties?: Record<string, any>) => {
    analytics.track('page_view', { page: name, ...properties });
  },

  user: (userId: string, traits?: Record<string, any>) => {
    // Identify user in analytics
  }
};

// Hook for component analytics
export const useAnalytics = (componentName: string) => {
  useEffect(() => {
    analytics.track('component_mounted', { component: componentName });
    
    return () => {
      analytics.track('component_unmounted', { component: componentName });
    };
  }, [componentName]);

  const trackEvent = (event: string, properties?: Record<string, any>) => {
    analytics.track(event, {
      component: componentName,
      ...properties
    });
  };

  return { trackEvent };
};

// Usage in components
const DocumentUploader = () => {
  const { trackEvent } = useAnalytics('DocumentUploader');

  const handleUpload = (files: File[]) => {
    trackEvent('documents_uploaded', {
      file_count: files.length,
      total_size: files.reduce((sum, file) => sum + file.size, 0)
    });
    
    // Upload logic...
  };

  return (
    <DropZone onDrop={handleUpload} />
  );
};
```

## Testing Integration Patterns

### Component Testing with Context
```typescript
// Test utilities
export const renderWithProviders = (
  ui: React.ReactElement,
  options: {
    client?: Client;
    user?: User;
    queryClient?: QueryClient;
  } = {}
) => {
  const {
    client = mockClient,
    user = mockUser,
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
  } = options;

  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ClientProvider initialClient={client}>
        <UserProvider initialUser={user}>
          {children}
        </UserProvider>
      </ClientProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: AllProviders });
};

// Integration test example
describe('DocumentUpload Integration', () => {
  it('should upload document and trigger AI analysis', async () => {
    const mockFiles = [new File(['content'], 'test.pdf', { type: 'application/pdf' })];
    
    renderWithProviders(<DocumentUploader />);
    
    const dropzone = screen.getByTestId('document-dropzone');
    
    // Simulate file drop
    await userEvent.upload(dropzone, mockFiles);
    
    // Verify upload started
    expect(screen.getByText('Laster opp...')).toBeInTheDocument();
    
    // Wait for upload completion
    await waitFor(() => {
      expect(screen.getByText('Opplasting fullført')).toBeInTheDocument();
    });
    
    // Verify AI analysis was triggered
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'extract-document-text',
      expect.objectContaining({
        body: expect.objectContaining({
          documentId: expect.any(String)
        })
      })
    );
  });
});
```