
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const usePendingRequests = () => {
  const { user, isGlobalAdmin } = useAuth();
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasPendingRequests(false);
      setLoading(false);
      return;
    }

    checkPendingRequests();
  }, [user, isGlobalAdmin]);

  const checkPendingRequests = async () => {
    try {
      if (!user) return;

      let hasPending = false;

      // Check for pending organization requests (only global admins can approve these)
      if (isGlobalAdmin) {
        const { data: orgRequests, error: orgError } = await supabase
          .from('organization_requests')
          .select('id')
          .eq('status', 'pending')
          .limit(1);

        if (orgError) {
          console.error('Error checking organization requests:', orgError);
        } else if (orgRequests && orgRequests.length > 0) {
          hasPending = true;
        }
      }

      // Check for pending user requests
      // First, get user's profile to find their organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else if (profile?.organization_id) {
        // Check if user is trusted agent for any organization
        const { data: orgsAsTrustedAgent, error: trustedAgentError } = await supabase
          .from('organizations')
          .select('id')
          .eq('trusted_agent_email', user.email);

        if (trustedAgentError) {
          console.error('Error checking trusted agent status:', trustedAgentError);
        } else if (orgsAsTrustedAgent && orgsAsTrustedAgent.length > 0) {
          // Get organization IDs where user is trusted agent
          const trustedOrgIds = orgsAsTrustedAgent.map(org => org.id);

          // Check for pending user requests for these organizations
          const { data: userRequests, error: userRequestError } = await supabase
            .from('user_requests')
            .select('id')
            .eq('status', 'pending')
            .in('organization_id', trustedOrgIds)
            .limit(1);

          if (userRequestError) {
            console.error('Error checking user requests:', userRequestError);
          } else if (userRequests && userRequests.length > 0) {
            hasPending = true;
          }
        }
      }

      // Global admins can also approve user requests
      if (isGlobalAdmin && !hasPending) {
        const { data: allUserRequests, error: allUserRequestError } = await supabase
          .from('user_requests')
          .select('id')
          .eq('status', 'pending')
          .limit(1);

        if (allUserRequestError) {
          console.error('Error checking all user requests:', allUserRequestError);
        } else if (allUserRequests && allUserRequests.length > 0) {
          hasPending = true;
        }
      }

      setHasPendingRequests(hasPending);
    } catch (error) {
      console.error('Error checking pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return { hasPendingRequests, loading, refreshPendingRequests: checkPendingRequests };
};
