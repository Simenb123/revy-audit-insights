
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface ClientStatsCardProps {
  title: string;
  description: string;
  value: string | number;
  footer?: ReactNode;
}

const ClientStatsCard = ({ title, description, value, footer }: ClientStatsCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {footer && <div className="mt-2 text-sm text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  );
};

export default ClientStatsCard;
