
import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  Upload
} from "lucide-react";

interface ClientNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ClientNavigation = ({ activeTab, onTabChange }: ClientNavigationProps): JSX.Element | null => {
  // Navigation tabs are now handled by the sidebar
  return null;
};

export default ClientNavigation;
