
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type OrgAdminView = 'dashboard' | 'scac';

interface OrgAdminNavigationProps {
  currentView: OrgAdminView;
  onViewChange: (view: OrgAdminView) => void;
}

export const OrgAdminNavigation = ({ currentView, onViewChange }: OrgAdminNavigationProps) => {
  const { user } = useAuth();
  const [pendingScacClaims, setPendingScacClaims] = useState(0);

  useEffect(() => {
    if (user) {
      checkPendingScacClaims();
    }
  }, [user]);

  const checkPendingScacClaims = async () => {
    try {
      if (!user) return;

      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      // Check for pending SCAC claims for their organization
      const { count: pendingCount } = await supabase
        .from('scac_claims')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('organization_id', profile.organization_id);

      setPendingScacClaims(pendingCount || 0);
    } catch (error) {
      console.error('Error checking pending SCAC claims:', error);
    }
  };

  return (
    <div className="flex gap-2 mb-6">
      <Button 
        variant={currentView === 'dashboard' ? 'default' : 'outline'}
        onClick={() => onViewChange('dashboard')}
      >
        <Users size={16} className="mr-2" />
        Users & Requests
      </Button>
      <Button 
        variant={currentView === 'scac' ? 'default' : 'outline'}
        onClick={() => onViewChange('scac')}
        className="relative"
      >
        <Building2 size={16} className="mr-2" />
        SCAC Management
        {pendingScacClaims > 0 && (
          <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
            {pendingScacClaims}
          </Badge>
        )}
      </Button>
    </div>
  );
};
