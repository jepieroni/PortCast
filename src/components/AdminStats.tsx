
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, AlertCircle, Trash2, Ship, MapPin, Globe, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SampleDataGenerator from './admin/SampleDataGenerator';

interface AdminStatsProps {
  onUserManagement: () => void;
  onOrganizationManagement: () => void;
  onAccessRequestManagement: () => void;
  onUserCleanup: () => void;
  onScacManagement: () => void;
  onPortManagement: () => void;
  onRateAreaManagement: () => void;
  onPortRegionManagement: () => void;
}

const AdminStats = ({ 
  onUserManagement, 
  onOrganizationManagement, 
  onAccessRequestManagement, 
  onUserCleanup,
  onScacManagement,
  onPortManagement,
  onRateAreaManagement,
  onPortRegionManagement
}: AdminStatsProps) => {
  const [userCount, setUserCount] = useState(0);
  const [organizationCount, setOrganizationCount] = useState(0);
  const [accessRequestCount, setAccessRequestCount] = useState(0);
  const [cleanupCandidateCount, setCleanupCandidateCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { count: users } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        setUserCount(users || 0);

        const { count: organizations } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true });
        setOrganizationCount(organizations || 0);

        const { count: orgRequests } = await supabase
          .from('organization_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        const { count: userRequests } = await supabase
          .from('user_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        setAccessRequestCount((orgRequests || 0) + (userRequests || 0));

        const { count: cleanupCandidates } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .is('deactivated_at', null)
          .lt('last_active', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
        setCleanupCandidateCount(cleanupCandidates || 0);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manage user accounts, roles, and permissions within the system.
            </p>
            <p className="text-2xl font-bold text-blue-700">{userCount}</p>
            <p className="text-sm text-gray-500">Total Users</p>
            <Button onClick={onUserManagement} className="w-full mt-4">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="text-green-600" size={20} />
              Organization Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manage organizations, their details, and associated users.
            </p>
            <p className="text-2xl font-bold text-green-700">{organizationCount}</p>
            <p className="text-sm text-gray-500">Total Organizations</p>
            <Button onClick={onOrganizationManagement} className="w-full mt-4">
              Manage Organizations
            </Button>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-yellow-600" size={20} />
              Access Request Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Review and approve or deny user access requests.
            </p>
            <p className="text-2xl font-bold text-yellow-700">{accessRequestCount}</p>
            <p className="text-sm text-gray-500">Pending Requests</p>
            <Button onClick={onAccessRequestManagement} className="w-full mt-4">
              Manage Access Requests
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="text-red-600" size={20} />
              User Cleanup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Identify and remove inactive user accounts to maintain system hygiene.
            </p>
            <p className="text-2xl font-bold text-red-700">{cleanupCandidateCount}</p>
            <p className="text-sm text-gray-500">Cleanup Candidates</p>
            <Button onClick={onUserCleanup} className="w-full mt-4">
              Manage User Cleanup
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="text-purple-600" size={20} />
              SCAC Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manage Standard Carrier Alpha Codes (SCAC) and their assignments to organizations.
            </p>
            <Button onClick={onScacManagement} className="w-full mt-4">
              Manage SCACs
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="text-blue-600" size={20} />
              Port Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manage port codes and their details within the system.
            </p>
            <Button onClick={onPortManagement} className="w-full mt-4">
              Manage Ports
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="text-green-600" size={20} />
              Rate Area Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manage rate areas and their details within the system.
            </p>
            <Button onClick={onRateAreaManagement} className="w-full mt-4">
              Manage Rate Areas
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="text-purple-600" size={20} />
              Sample Data Generator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Generate sample CSV files for testing bulk shipment uploads with realistic data.
            </p>
            <SampleDataGenerator />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStats;
