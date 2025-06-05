
import { supabase } from '@/integrations/supabase/client';

export const checkForStagingRecords = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.organization_id) return false;

    const { data: stagingRecords, error } = await supabase
      .from('shipment_uploads_staging')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .limit(1);

    if (error) throw error;

    return stagingRecords && stagingRecords.length > 0;
  } catch (error: any) {
    console.error('Error checking staging records:', error);
    return false;
  }
};

export const loadStagingRecordsFromDatabase = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.organization_id) throw new Error('Organization not found');

  // Load all staging records for this organization
  const { data: stagingRecords, error } = await supabase
    .from('shipment_uploads_staging')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: true });

  if (error) throw error;

  if (!stagingRecords || stagingRecords.length === 0) {
    return [];
  }

  console.log('Loading staging records:', stagingRecords.length);
  return stagingRecords;
};

export const cleanupStagingRecords = async (recordIds: string[]) => {
  if (recordIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('shipment_uploads_staging')
      .delete()
      .in('id', recordIds);

    if (deleteError) {
      console.error('Cleanup error:', deleteError);
      // Don't throw here as the main operation succeeded
    } else {
      console.log('Cleaned up staging records:', recordIds.length);
    }
  }
};
