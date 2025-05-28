
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building, Ship } from 'lucide-react';

const AdminStats = () => {
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
          <p className="text-gray-600 mb-4">Manage user roles and permissions</p>
          <Button className="w-full">Manage Users</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-emerald-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Building size={24} />
            Organizations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-600 mb-4">Manage organizations and trusted agents</p>
          <Button className="w-full">Manage Organizations</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-purple-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Ship size={24} />
            System Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-600 mb-4">Manage ports, countries, and TSPs</p>
          <Button className="w-full">Manage Data</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
