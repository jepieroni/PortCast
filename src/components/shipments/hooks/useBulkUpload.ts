import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// This is the old bulk upload hook - keeping for compatibility but redirecting to new system
export const useBulkUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    toast({
      title: "Redirecting",
      description: "Please use the new bulk upload system",
      variant: "destructive"
    });
    return null;
  };

  return {
    uploadFile,
    isUploading,
    uploadSession: null,
    error: null
  };
};
