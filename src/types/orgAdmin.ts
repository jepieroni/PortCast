
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface OrgUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

export interface OrgUserRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  requested_at: string;
  reviewed_at?: string;
  approval_token: string;
}
