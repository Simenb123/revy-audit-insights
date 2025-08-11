import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useSuperAdmins(enabled: boolean) {
  return useQuery({
    queryKey: ['app-super-admins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_super_admins')
        .select('user_id, created_at, note')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export default function Superadmin() {
  const { data: isSuperAdmin, isLoading, isError } = useIsSuperAdmin();
  const { data: admins, isLoading: adminsLoading } = useSuperAdmins(Boolean(isSuperAdmin));

  useEffect(() => {
    // Basic SEO
    document.title = 'Superadmin – Revio';
    const ensureMeta = (name: string, content: string) => {
      let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };
    ensureMeta('description', 'Superadmin: administrer superadministratorer og systeminnstillinger.');

    // Canonical
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = window.location.href;
  }, []);

  if (isLoading) {
    return (
      <main className="container mx-auto p-4">
        <p className="text-sm text-muted-foreground">Laster…</p>
      </main>
    );
  }

  if (isError || !isSuperAdmin) {
    return (
      <main className="container mx-auto p-4">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Superadmin</h1>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Ingen tilgang</CardTitle>
            <CardDescription>Du må være superadministrator for å se denne siden.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <>
      <header className="container mx-auto p-4">
        <h1 className="text-3xl font-semibold tracking-tight">Superadmin</h1>
        <p className="text-sm text-muted-foreground mt-1">Systemadministrasjon og oversikt.</p>
      </header>
      <main className="container mx-auto p-4 grid gap-4 md:grid-cols-2">
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Tilgang</CardTitle>
              <CardDescription>Du er registrert som superadministrator.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Global lese- og skrive-tilgang der RLS tillater superadmin.</li>
                <li>Mulighet for systemvedlikehold og nøkkelfunksjoner.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Superadmin-brukere</CardTitle>
              <CardDescription>Liste over registrerte superadministratorer.</CardDescription>
            </CardHeader>
            <CardContent>
              {adminsLoading ? (
                <p className="text-sm text-muted-foreground">Laster liste…</p>
              ) : admins && admins.length > 0 ? (
                <div className="space-y-2">
                  {admins.map((a: any) => (
                    <div key={a.user_id} className="flex items-center justify-between rounded-md border p-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{a.user_id}</p>
                        {a.note && <p className="text-sm text-muted-foreground truncate">{a.note}</p>}
                      </div>
                      <time className="text-xs text-muted-foreground" dateTime={a.created_at}>
                        {new Date(a.created_at).toLocaleString()}
                      </time>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen superadministratorer funnet.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
