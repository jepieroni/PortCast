
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building, FileText, Trash2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStatsProps {
  onUserManagement: () => void;
  onOrganizationManagement: () => void;
  onAccessRequestManagement: () => void;
  onUserCleanup: () => void;
  onScacManagement: () => void;
}

interface Stats {
  totalUsers: number;
  totalOrganizations: number;
  pendingOrgRequests: number;
  pendingUserRequests: number;
  pendingScacClaims: number;
}

const AdminStats = ({ 
  onUserManagement, 
  onOrganizationManagement, 
  onAccessRequestManagement, 
  onUserCleanup,
  onScacManagement 
}: AdminStatsProps) => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOrganizations: 0,
    pendingOrgRequests: 0,
    pendingUserRequests: 0,
    pendingScacClaims: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch organizations count
      const { count: orgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // Fetch pending organization requests
      const { count: pendingOrgCount } = await supabase
        .from('organization_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch pending user requests
      const { count: pendingUserCount } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch pending SCAC claims
      const { count: pendingScacCount } = await supabase
        .from('scac_claims')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalUsers: usersCount || 0,
        totalOrganizations: orgsCount || 0,
        pendingOrgRequests: pendingOrgCount || 0,
        pendingUserRequests: pendingUserCount || 0,
        pendingScacClaims: pendingScacCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Org Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrgRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending User Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingUserRequests}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage user accounts, roles, and permissions across the system.
            </p>
            <Button onClick={onUserManagement} className="w-full">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building size={20} />
              Organization Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage organizations and their settings.
            </p>
            <Button onClick={onOrganizationManagement} className="w-full">
              Manage Organizations
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Access Requests
              {(stats.pendingOrgRequests + stats.pendingUserRequests) > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.pendingOrgRequests + stats.pendingUserRequests}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Review and approve organization and user access requests.
            </p>
            <Button onClick={onAccessRequestManagement} className="w-full">
              Review Requests
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={20} />
              SCAC Management
              {stats.pendingScacClaims > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.pendingScacClaims}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage TSP (SCAC) assignments and approve organization claims.
            </p>
            <Button onClick={onScacManagement} className="w-full">
              Manage SCACs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 size={20} />
              User Cleanup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Remove users and clean up associated data from the system.
            </p>
            <Button onClick={onUserCleanup} variant="destructive" className="w-full">
              User Cleanup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStats;
