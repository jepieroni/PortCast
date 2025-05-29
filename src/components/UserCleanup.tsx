
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserCleanupProps {
  onBack: () => void;
}

interface UserForCleanup {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  organization_name?: string;
  role?: string;
  shipments_count: number;
}

interface CleanupResponse {
  success: boolean;
  users?: UserForCleanup[];
  message?: string;
}

interface DeleteResponse {
  success: boolean;
  message?: string;
  user_email?: string;
  records_cleaned?: {
    shipments: number;
    account_setup_tokens: number;
    organization_requests_reviewed: number;
    user_requests_reviewed: number;
    user_roles: number;
    profiles: number;
    auth_users: number;
  };
}

const UserCleanup = ({ onBack }: UserCleanupProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserForCleanup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users for cleanup...');
      
      const { data, error } = await supabase.rpc('get_users_for_cleanup');

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Users data received:', data);

      const response = data as CleanupResponse;
      if (response?.success) {
        setUsers(response.users || []);
      } else {
        throw new Error(response?.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users for cleanup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    setDeletingUserId(userId);
    try {
      console.log('Deleting user:', userId);
      
      const { data, error } = await supabase.rpc('cleanup_user_completely', {
        _user_id: userId
      });

      if (error) {
        console.error('Error deleting user:', error);
        throw error;
      }

      console.log('Cleanup result:', data);

      const response = data as DeleteResponse;
      if (response?.success) {
        toast({
          title: "User Deleted",
          description: `${userEmail} and all associated data have been completely removed from the system.`,
        });
        
        // Remove user from local state
        setUsers(users.filter(user => user.id !== userId));
      } else {
        throw new Error(response?.message || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error in deleteUser:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Admin Dashboard
        </Button>
        <h2 className="text-2xl font-bold">User Cleanup</h2>
        <Badge variant="destructive">DANGER ZONE</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            Complete User Deletion
          </CardTitle>
          <p className="text-gray-600">
            This tool allows you to completely remove users and ALL their associated data from the system. 
            This action is irreversible and should only be used for test accounts.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Shipments</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No name'}</TableCell>
                  <TableCell className="font-mono text-sm">{user.email}</TableCell>
                  <TableCell>
                    {user.organization_name ? (
                      <Badge variant="outline">{user.organization_name}</Badge>
                    ) : (
                      <span className="text-gray-400">No organization</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.role ? (
                      <Badge variant={user.role === 'global_admin' ? 'destructive' : 'default'}>
                        {user.role}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No role</Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.shipments_count}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 size={14} className="mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Permanently Delete User?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will completely remove <strong>{user.email}</strong> and ALL associated data including:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>User profile and authentication</li>
                              <li>All shipments ({user.shipments_count} shipments)</li>
                              <li>Role assignments</li>
                              <li>Access requests</li>
                              <li>Account setup tokens</li>
                              <li>Any review references</li>
                            </ul>
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                              <strong className="text-red-800">This action cannot be undone!</strong>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser(user.id, user.email)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Yes, Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No users found in the system.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserCleanup;
