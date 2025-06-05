
import { supabase } from '@/integrations/supabase/client';
import { processUploadedFile } from './utils/fileProcessor';
import { createStagingRecords } from './utils/stagingRecordCreator';
import { processAndValidateRecords } from './utils/validationProcessor';

export const useFileUpload = () => {
  const uploadFile = async (file: File) => {
    try {
      // Get user and organization info first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.organization_id) throw new Error('Organization not found');

      // Process the uploaded file
      const records = await processUploadedFile(file);

      // Create staging records
      const uploadSessionId = await createStagingRecords(records, profile.organization_id, user.id);

      // Process and validate records
      const result = await processAndValidateRecords(uploadSessionId);

      return result;

    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  return {
    uploadFile
  };
};
