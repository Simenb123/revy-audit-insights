
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle, Clock, FileText, User } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';

type ProjectCardProps = {
  className?: string;
};

const ProjectCard = ({ className }: ProjectCardProps) => {
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Årsrevisjon 2024</CardTitle>
            <CardDescription>Nordheim AS</CardDescription>
          </div>
          <Badge className="bg-revio-100 text-revio-800 hover:bg-revio-200">Aktiv</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-medium">Fremdrift</span>
              <span>65%</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Prosjektdetaljer</h4>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-muted-foreground" />
              <span>Frist: 15. juni 2025</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User size={16} className="text-muted-foreground" />
              <span>Klient: Nordheim AS</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <FileText size={16} className="text-muted-foreground" />
              <span>Dokumenter: 24</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Siste aktiviteter</h4>
            
            <div className="space-y-2">
              <div className="text-xs bg-gray-50 p-2 rounded">
                <div className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 mt-0.5" />
                  <div>
                    <p>Saldobalanse lastet opp</p>
                    <span className="text-muted-foreground">I går, 15:30</span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs bg-gray-50 p-2 rounded">
                <div className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 mt-0.5" />
                  <div>
                    <p>Konto 3000-serien analysert</p>
                    <span className="text-muted-foreground">3 dager siden</span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs bg-gray-50 p-2 rounded">
                <div className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-500 mt-0.5" />
                  <div>
                    <p>Mapping av kontoplan fullført</p>
                    <span className="text-muted-foreground">5 dager siden</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Revisjonsteam</h4>
            <div className="flex -space-x-2">
              <Avatar className="border-2 border-white">
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <Avatar className="border-2 border-white">
                <AvatarFallback>MH</AvatarFallback>
              </Avatar>
              <Avatar className="border-2 border-white">
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
