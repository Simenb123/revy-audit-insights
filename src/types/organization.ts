
export type UserRole = 'admin' | 'partner' | 'manager' | 'employee';
export type CommunicationType = 'team' | 'department' | 'firm';
export type AuditLogAction = 'review_completed' | 'task_assigned' | 'document_uploaded' | 'analysis_performed';

export interface AuditFirm {
  id: string;
  name: string;
  orgNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  auditFirmId: string;
  name: string;
  description?: string;
  partnerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  workplaceCompanyName?: string;
  auditFirmId?: string;
  departmentId?: string;
  userRole: UserRole;
  hireDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientTeam {
  id: string;
  clientId: string;
  departmentId: string;
  teamLeadId?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  assignedDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface TeamCommunication {
  id: string;
  communicationType: CommunicationType;
  referenceId: string;
  senderId: string;
  message: string;
  isAnnouncement: boolean;
  parentMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  clientId: string;
  userId: string;
  reviewerId?: string;
  actionType: AuditLogAction;
  areaName: string;
  description?: string;
  isReviewed: boolean;
  reviewedAt?: string;
  metadata?: any;
  createdAt: string;
}
