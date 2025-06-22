import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from 'lucide-react';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AppBreadcrumb = () => {
  const location = useLocation();
  const { orgNumber, categoryId, slug } = useParams<{ 
    orgNumber: string; 
    categoryId: string; 
    slug: string; 
  }>();
  const { data: client } = useClientDetails(orgNumber || '');
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Fetch category name if we're in a category route
  const { data: category } = useQuery({
    queryKey: ['knowledge-category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('name')
        .eq('id', categoryId)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!categoryId
  });

  // Fetch article title if we're in an article route
  const { data: article } = useQuery({
    queryKey: ['knowledge-article-breadcrumb', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('title, category:knowledge_categories(name)')
        .eq('slug', slug)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!slug
  });

  // Simple route name mapping
  const getRouteName = (segment: string, index: number) => {
    const routeNames: Record<string, string> = {
      'dashboard': 'Dashboard',
      'klienter': 'Klienter',
      'regnskap': 'Regnskap',
      'analyser': 'Analyser',
      'regnskapsdata': 'Regnskapsdata',
      'spesialdata': 'Spesialdata',
      'transaksjoner': 'Transaksjoner',
      'import': 'Import',
      'organization': 'Organisasjon',
      'teams': 'Teams',
      'fag': 'Fagstoff',
      'ai-usage': 'AI-bruk',
      'kategori': category?.name || 'Kategori',
      'artikkel': article?.title || 'Artikkel',
      'ny-artikkel': 'Ny artikkel',
      'sok': 'Søk',
      'upload': 'Last opp',
      'revisjonshandlinger': 'Revisjonshandlinger',
      'mine': 'Mine artikler',
      'favoritter': 'Favoritter',
      'admin': 'Admin'
    };
    
    // If it's an org number and we have client data, use client name
    if (segment.match(/^\d+$/) && client) {
      return client.company_name || client.name;
    }
    
    // Handle dynamic segments
    if (segment === categoryId && category) {
      return category.name;
    }
    
    if (segment === slug && article) {
      return article.title;
    }
    
    return routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  // Handle root/dashboard case
  if (location.pathname === '/' || location.pathname === '/dashboard') {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1 text-sidebar-foreground">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Special handling for knowledge base routes
  const isKnowledgeRoute = pathSegments[0] === 'fag';
  
  const buildKnowledgeBreadcrumbs = () => {
    const crumbs = [];
    
    // Always start with Dashboard
    crumbs.push(
      <BreadcrumbItem key="dashboard">
        <BreadcrumbLink asChild>
          <Link to="/dashboard" className="flex items-center gap-1 text-sidebar-foreground hover:text-sidebar-primary">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    );
    
    crumbs.push(<BreadcrumbSeparator key="sep-0" className="text-sidebar-foreground/60" />);
    
    // Add Fagstoff
    if (pathSegments.length === 1) {
      // We're on /fag
      crumbs.push(
        <BreadcrumbItem key="fag">
          <BreadcrumbPage className="text-sidebar-foreground">Fagstoff</BreadcrumbPage>
        </BreadcrumbItem>
      );
    } else {
      crumbs.push(
        <BreadcrumbItem key="fag">
          <BreadcrumbLink asChild>
            <Link to="/fag" className="text-sidebar-foreground hover:text-sidebar-primary">Fagstoff</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      );
      
      crumbs.push(<BreadcrumbSeparator key="sep-1" className="text-sidebar-foreground/60" />);
      
      // Handle sub-routes
      if (pathSegments[1] === 'kategori' && categoryId) {
        if (pathSegments.length === 3) {
          // We're on /fag/kategori/:id
          crumbs.push(
            <BreadcrumbItem key="category">
              <BreadcrumbPage className="text-sidebar-foreground">
                {category?.name || 'Kategori'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          );
        }
      } else if (pathSegments[1] === 'artikkel' && slug) {
        // We're on /fag/artikkel/:slug
        if (article?.category) {
          crumbs.push(
            <BreadcrumbItem key="category">
              <BreadcrumbLink asChild>
                <Link to={`/fag/kategori/${categoryId || 'unknown'}`} className="text-sidebar-foreground hover:text-sidebar-primary">
                  {article.category.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          );
          crumbs.push(<BreadcrumbSeparator key="sep-2" className="text-sidebar-foreground/60" />);
        }
        
        crumbs.push(
          <BreadcrumbItem key="article">
            <BreadcrumbPage className="text-sidebar-foreground">
              {article?.title || 'Artikkel'}
            </BreadcrumbPage>
          </BreadcrumbItem>
        );
      } else {
        // Other routes like /fag/ny-artikkel, /fag/sok, etc.
        const routeName = getRouteName(pathSegments[1], 1);
        crumbs.push(
          <BreadcrumbItem key={pathSegments[1]}>
            <BreadcrumbPage className="text-sidebar-foreground">{routeName}</BreadcrumbPage>
          </BreadcrumbItem>
        );
      }
    }
    
    return crumbs;
  };

  if (isKnowledgeRoute) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {buildKnowledgeBreadcrumbs()}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Default breadcrumb handling for non-knowledge routes
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center gap-1 text-sidebar-foreground hover:text-sidebar-primary">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const fullPath = '/' + pathSegments.slice(0, index + 1).join('/');
          const breadcrumbName = getRouteName(segment, index);

          return (
            <React.Fragment key={fullPath}>
              <BreadcrumbSeparator className="text-sidebar-foreground/60" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-sidebar-foreground">{breadcrumbName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={fullPath} className="text-sidebar-foreground hover:text-sidebar-primary">{breadcrumbName}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default AppBreadcrumb;
