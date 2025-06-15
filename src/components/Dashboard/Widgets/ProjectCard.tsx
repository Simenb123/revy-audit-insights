
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle, Clock, FileText, User } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import { useClientData } from '@/components/Clients/ClientFetcher/useClientData';
import { Skeleton } from '@/components/ui/skeleton';

type ProjectCardProps = {
  className?: string;
};

const ProjectCard = ({ className }: ProjectCardProps) => {
  const { data: clients, isLoading } = useClientData();

  const renderSkeleton = () => (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        <div>
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );

  if (isLoading) return renderSkeleton();

  if (!clients || clients.length === 0) {
    return (
      <Card className={cn("h-full flex flex-col justify-center items-center p-6", className)}>
        <CardHeader className="text-center">
          <CardTitle>Ingen prosjekter</CardTitle>
          <CardDescription>Ingen klientdata funnet for å vise her.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Display the most recently updated client's project
  const projectClient = [...clients].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
  
  // Mock team for now as this data is not on the client object
  const team = [ { name: 'AS' }, { name: 'MH' }, { name: 'JD' } ];

  const getYear = (dateString: string | null) => {
    if (!dateString) return new Date().getFullYear();
    return new Date(dateString).getFullYear();
  };
  
  const formatDateString = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('nb-NO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Ugyldig dato';
    }
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Årsrevisjon {getYear(projectClient.year_end_date)}</CardTitle>
            <CardDescription>{projectClient.name}</CardDescription>
          </div>
          <Badge className="bg-revio-100 text-revio-800 hover:bg-revio-200 capitalize">{projectClient.phase || 'Aktiv'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">Fremdrift</span>
              <span>{projectClient.progress}%</span>
            </div>
            <Progress value={projectClient.progress} className="h-2" />
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Prosjektdetaljer</h4>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-muted-foreground" />
              <span>Frist: {formatDateString(projectClient.year_end_date)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User size={16} className="text-muted-foreground" />
              <span>Klient: {projectClient.name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <FileText size={16} className="text-muted-foreground" />
              <span>Dokumenter: {projectClient.documents.length}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Siste aktiviteter</h4>
            
            <div className="text-xs text-center text-muted-foreground p-4 rounded bg-gray-50/50 border">
                Data for siste aktiviteter er ikke tilgjengelig for øyeblikket.
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Revisjonsteam</h4>
            <div className="flex -space-x-2">
              <Avatar className="border-2 border-background">
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <Avatar className="border-2 border-background">
                <AvatarFallback>MH</AvatarFallback>
              </Avatar>
              <Avatar className="border-2 border-background">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-revio-500 hover:bg-revio-600">
          <span>Åpne prosjekt</span>
          <ArrowUpRight size={16} className="ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
