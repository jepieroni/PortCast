
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
    console.error('Update error:', updateError);
    throw updateError;
  }
};

export const markRecordAsInvalid = async (
  recordId: string, 
  errors: string[]
): Promise<void> => {
  await supabase
    .from('shipment_uploads_staging')
    .update({
      validation_status: 'invalid',
      validation_errors: errors,
      updated_at: new Date().toISOString()
    })
    .eq('id', recordId);
};
