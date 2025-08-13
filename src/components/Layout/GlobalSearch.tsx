
import React, { useState, useEffect } from 'react';
import { Search, Command, FileText, Users, Book, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  type: 'client' | 'article' | 'document' | 'page';
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ComponentType<any>;
}

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search function
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search clients
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name, company_name')
          .or(`name.ilike.%${debouncedQuery}%,company_name.ilike.%${debouncedQuery}%`)
          .limit(5);

        if (clients) {
          searchResults.push(...clients.map(client => ({
            type: 'client' as const,
            id: client.id,
            title: client.name || 'Uten navn',
            subtitle: client.company_name || '',
            url: `/clients/${client.id}`,
            icon: Users
          })));
        }

        // Search knowledge articles
        const { data: articles } = await supabase
          .from('knowledge_articles')
          .select('id, title, summary')
          .or(`title.ilike.%${debouncedQuery}%,summary.ilike.%${debouncedQuery}%`)
          .eq('status', 'published')
          .limit(5);

        if (articles) {
          searchResults.push(...articles.map(article => ({
            type: 'article' as const,
            id: article.id,
            title: article.title || 'Uten tittel',
            subtitle: article.summary || '',
            url: `/fag/articles/${article.id}`,
            icon: Book
          })));
        }

        // Add static pages based on query
        const pageMatches = [
          { query: ['dashboard', 'hjem'], title: 'Dashboard', url: '/dashboard', icon: Brain },
          { query: ['klient', 'client'], title: 'Klienter', url: '/clients', icon: Users },
          { query: ['fagstoff', 'knowledge'], title: 'Fagstoff', url: '/fag', icon: Book },
          { query: ['dokument'], title: 'Dokumenter', url: '/documents', icon: FileText },
          { query: ['ai', 'revy'], title: 'AI-Revy Admin', url: '/ai-revy-admin', icon: Brain },
        ].filter(page => 
          page.query.some(keyword => 
            keyword.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            debouncedQuery.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        searchResults.push(...pageMatches.map(page => ({
          type: 'page' as const,
          id: page.url,
          title: page.title,
          url: page.url,
          icon: page.icon
        })));

        setResults(searchResults.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Søk...</span>
        <span className="inline-flex lg:hidden">Søk</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Søk etter klienter, fagstoff, sider..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? 'Søker...' : 'Ingen resultater funnet.'}
          </CommandEmpty>
          
          {results.length > 0 && (
            <>
              {/* Group results by type */}
              {results.filter(r => r.type === 'page').length > 0 && (
                <CommandGroup heading="Sider">
                  {results.filter(r => r.type === 'page').map((result) => {
                    const IconComponent = result.icon;
                    return (
                      <CommandItem
                        key={result.id}
                        value={`${result.title} ${result.subtitle || ''}`}
                        onSelect={() => handleSelect(result)}
                      >
                        <IconComponent className="mr-2 h-4 w-4" />
                        <span>{result.title}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              
              {results.filter(r => r.type === 'client').length > 0 && (
                <CommandGroup heading="Klienter">
                  {results.filter(r => r.type === 'client').map((result) => {
                    const IconComponent = result.icon;
                    return (
                      <CommandItem
                        key={result.id}
                        value={`${result.title} ${result.subtitle || ''}`}
                        onSelect={() => handleSelect(result)}
                      >
                        <IconComponent className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && (
                            <span className="text-xs text-muted-foreground">
                              {result.subtitle}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              
              {results.filter(r => r.type === 'article').length > 0 && (
                <CommandGroup heading="Fagstoff">
                  {results.filter(r => r.type === 'article').map((result) => {
                    const IconComponent = result.icon;
                    return (
                      <CommandItem
                        key={result.id}
                        value={`${result.title} ${result.subtitle || ''}`}
                        onSelect={() => handleSelect(result)}
                      >
                        <IconComponent className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && (
                            <span className="text-xs text-muted-foreground">
                              {result.subtitle}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;
