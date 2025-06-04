
import { supabase } from '@/integrations/supabase/client';

export const getUserOrganization = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    throw new Error('User not authenticated');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) {
    console.error('User organization not found for user:', user.id);
    throw new Error('User organization not found');
  }

  console.log('User organization ID:', profile.organization_id);
  return profile.organization_id;
};

export const updateStagingRecord = async (
  recordId: string, 
  updates: any, 
  validationStatus: 'valid' | 'invalid', 
  validationErrors: string[]
): Promise<void> => {
  console.log('Updating staging record:', recordId, 'with status:', validationStatus, 'and updates:', updates);
  
  const { error: updateError } = await supabase
    .from('shipment_uploads_staging')
    .update({
      ...updates,
      validation_status: validationStatus,
      validation_errors: validationErrors,
      updated_at: new Date().toISOString()
    })
    .eq('id', recordId);

  if (updateError) {
    console.error('Update error for record', recordId, ':', updateError);
    throw updateError;
  }
  
  console.log('Successfully updated staging record:', recordId, 'with status:', validationStatus);
};

export const markRecordAsInvalid = async (
  recordId: string, 
  errors: string[]
): Promise<void> => {
  console.log('Marking record as invalid:', recordId, 'with errors:', errors);
  
  const { error } = await supabase
    .from('shipment_uploads_staging')
    .update({
      validation_status: 'invalid',
      validation_errors: errors,
      updated_at: new Date().toISOString()
    })
    .eq('id', recordId);
    
  if (error) {
    console.error('Error marking record as invalid:', error);
    throw error;
  }
  
  console.log('Successfully marked record as invalid:', recordId);
};
