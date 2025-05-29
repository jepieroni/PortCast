
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building, FileText } from 'lucide-react';

interface AdminStatsProps {
  onUserManagement: () => void;
  onOrganizationManagement: () => void;
  onAccessRequestManagement: () => void;
}

const AdminStats = ({ onUserManagement, onOrganizationManagement, onAccessRequestManagement }: AdminStatsProps) => {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Users size={24} />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-600 mb-4">Manage users, roles, and permissions</p>
          <Button className="w-full" onClick={onUserManagement}>Manage Users</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-emerald-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Building size={24} />
            Organizations & TSPs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-600 mb-4">Manage organizations and transportation service providers</p>
          <Button className="w-full" onClick={onOrganizationManagement}>Manage Organizations</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-purple-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <FileText size={24} />
            App Access Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-600 mb-4">Review and manage organization and user access requests</p>
          <Button className="w-full" onClick={onAccessRequestManagement}>Manage Requests</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
