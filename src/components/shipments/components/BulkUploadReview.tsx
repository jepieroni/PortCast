
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import TranslationMappingDialog from './TranslationMappingDialog';
import NewRateAreaDialog from './NewRateAreaDialog';
import AddPortFromReviewDialog from './AddPortFromReviewDialog';
import ValidationSummaryCards from './ValidationSummaryCards';
import SimplifiedReviewTable from './SimplifiedReviewTable';
import BulkUploadHeader from './BulkUploadHeader';
import BulkUploadActions from './BulkUploadActions';
import ShipmentEditModal from './ShipmentEditModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBulkUploadNew } from '../hooks/useBulkUploadNew';

interface BulkUploadReviewProps {
  uploadSessionId: string;
  onBack: () => void;
  onComplete: () => void;
}

const BulkUploadReview = ({ uploadSessionId, onBack, onComplete }: BulkUploadReviewProps) => {
  const { toast } = useToast();

  // For now, redirect to the new bulk upload system
  // This is a placeholder until we fully migrate
  useEffect(() => {
    toast({
      title: "Redirecting",
      description: "Using the new bulk upload system",
    });
    onBack();
  }, [onBack, toast]);

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Redirecting to new upload system...</p>
      </div>
    </div>
  );
};

export default BulkUploadReview;
