import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Settings, User, Search } from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';
import { Users, Book, Brain, FileText, MessageSquare } from 'lucide-react';
import { RecentClientsDropdown } from './RecentClientsDropdown';
import TeamChatPanel from '@/components/Communication/TeamChatPanel';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { usePageTitle } from '@/components/Layout/PageTitleContext';

interface SearchResult {
  type: 'client' | 'article' | 'document' | 'page';
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ComponentType<any>;
}

interface GlobalHeaderProps {
  className?: string;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ className = '' }) => {
  const { session } = useAuth();
  const { data: profile } = useUserProfile();
  const navigate = useNavigate();
  const { pageTitle } = usePageTitle();
  
  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Team chat state
  const [teamChatOpen, setTeamChatOpen] = useState(false);
  const [teamChatMessages] = useState<string[]>([]);
  const [teamChatUnread, setTeamChatUnread] = useState(0);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userInitials = profile?.firstName && profile?.lastName
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`
    : session?.user?.email?.charAt(0).toUpperCase() || 'U';

  const userName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : session?.user?.email || 'Bruker';

  // Search functionality
  React.useEffect(() => {
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
            title: client.name,
            subtitle: client.company_name,
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
            title: article.title,
            subtitle: article.summary,
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
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setSearchOpen(false);
    setQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-revio-500 border-b border-revio-600 grid grid-cols-3 items-center px-6 py-3 text-white h-[var(--global-header-height)] shadow-sm">
        <div className="flex items-center">
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-wide text-white hover:opacity-90"
          >
            Revio
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-center truncate" data-testid="page-title">
          {pageTitle}
        </h1>

        <div className="flex items-center gap-3 justify-self-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-revio-600"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <div className="text-white">
            <RecentClientsDropdown />
          </div>

          <Dialog open={teamChatOpen} onOpenChange={setTeamChatOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="relative text-white hover:bg-revio-600">
                <MessageSquare className="h-5 w-5" />
                {teamChatUnread > 0 && (
                  <span
                    data-testid="teamchat-unread-badge"
                    className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"
                  />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0">
              <TeamChatPanel
                isOpen={teamChatOpen}
                messages={teamChatMessages}
                onUnreadChange={setTeamChatUnread}
              />
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" className="text-white hover:bg-revio-600">
            <Bell className="h-5 w-5" />
          </Button>
          
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white hover:bg-revio-600">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Innstillinger</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/organization/settings')}>
                Organisasjonsinnstillinger
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/organization')}>
                Organisasjonsoversikt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/organization/roles')}>
                Rolleadministrasjon
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-gray-100 text-gray-700">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Logg ut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
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
                  {results.filter(r => r.type === 'page').map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result)}
                    >
                      <result.icon className="mr-2 h-4 w-4" />
                      <span>{result.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {results.filter(r => r.type === 'client').length > 0 && (
                <CommandGroup heading="Klienter">
                  {results.filter(r => r.type === 'client').map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result)}
                    >
                      <result.icon className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-muted-foreground">
                            {result.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {results.filter(r => r.type === 'article').length > 0 && (
                <CommandGroup heading="Fagstoff">
                  {results.filter(r => r.type === 'article').map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result)}
                    >
                      <result.icon className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-muted-foreground">
                            {result.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalHeader;