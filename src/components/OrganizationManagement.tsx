
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Building, Ship } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrganizationManagementProps {
  onBack: () => void;
}

interface Organization {
  id: string;
  name: string;
  city?: string;
  state?: string;
  trusted_agent_email?: string;
  created_at: string;
}

interface TSP {
  id: string;
  name: string;
  scac_code: string;
  organization_name: string;
  created_at: string;
}

const OrganizationManagement = ({ onBack }: OrganizationManagementProps) => {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tsps, setTSPs] = useState<TSP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch organizations
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgError) throw orgError;

      // Fetch TSPs with organization info
      const { data: tspData, error: tspError } = await supabase
        .from('tsps')
        .select(`
          *,
          organizations (name)
        `)
        .order('created_at', { ascending: false });

      if (tspError) throw tspError;

      setOrganizations(orgData || []);
      setTSPs(tspData?.map(tsp => ({
        ...tsp,
        organization_name: tsp.organizations?.name || 'Unknown'
      })) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch organization data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">Organizations & Transportation Service Providers</h2>
      </div>

      <Tabs defaultValue="organizations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building size={16} />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="tsps" className="flex items-center gap-2">
            <Ship size={16} />
            TSPs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building size={20} />
                Organizations ({organizations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Trusted Agent</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        {org.city && org.state ? `${org.city}, ${org.state}` : 'Not specified'}
                      </TableCell>
                      <TableCell>{org.trusted_agent_email || 'Not assigned'}</TableCell>
                      <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tsps">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship size={20} />
                Transportation Service Providers ({tsps.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SCAC Code</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tsps.map((tsp) => (
                    <TableRow key={tsp.id}>
                      <TableCell className="font-medium">{tsp.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tsp.scac_code}</Badge>
                      </TableCell>
                      <TableCell>{tsp.organization_name}</TableCell>
                      <TableCell>{new Date(tsp.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationManagement;
