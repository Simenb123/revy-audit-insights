export interface JwtPayload {
  sub?: string;
  role?: string;
  user_role?: string;
  user_metadata?: {
    user_role?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: Request): JwtPayload | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return decodeJwt(token);
}

export function hasPermittedRole(user: JwtPayload | null, permittedRoles: string[]): boolean {
  if (!user) return false;
  
  // Check for role in multiple possible locations within the JWT payload
  const role = (
    user.user_role || 
    user.role || 
    user.user_metadata?.user_role
  ) as string | undefined;
  
  return !!role && permittedRoles.includes(role);
}
