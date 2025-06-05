
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface WarningApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warnings: string[];
  onApprove: (approvedWarningTypes: string[]) => void;
  gblNumber: string;
}

// Map warning messages to warning types for tracking
const getWarningType = (warningMessage: string): string => {
  if (warningMessage.includes('more than 30 days in the past')) {
    return 'pickup_date_past_30_days';
  }
  if (warningMessage.includes('more than 120 days in the future')) {
    return 'pickup_date_future_120_days';
  }
  // Add more warning type mappings as needed
  return 'unknown_warning';
};

export const WarningApprovalDialog = ({
  open,
  onOpenChange,
  warnings,
  onApprove,
  gblNumber
}: WarningApprovalDialogProps) => {
  const [selectedWarnings, setSelectedWarnings] = useState<Set<string>>(new Set());

  const handleWarningToggle = (warningType: string, checked: boolean) => {
    const newSelected = new Set(selectedWarnings);
    if (checked) {
      newSelected.add(warningType);
    } else {
      newSelected.delete(warningType);
    }
    setSelectedWarnings(newSelected);
  };

  const handleApproveAll = () => {
    const allWarningTypes = warnings.map(getWarningType);
    setSelectedWarnings(new Set(allWarningTypes));
  };

  const handleApprove = () => {
    onApprove(Array.from(selectedWarnings));
    onOpenChange(false);
    setSelectedWarnings(new Set());
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedWarnings(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={20} />
            Review Warnings for {gblNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            The following warnings were found. Please review and approve any that are acceptable:
          </p>

          <div className="space-y-3">
            {warnings.map((warning, index) => {
              const warningType = getWarningType(warning);
              const isSelected = selectedWarnings.has(warningType);
              
              return (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`warning-${index}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleWarningToggle(warningType, checked as boolean)}
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={`warning-${index}`}
                      className={`text-sm cursor-pointer ${isSelected ? 'line-through text-gray-500' : ''}`}
                    >
                      {warning}
                    </label>
                    {isSelected && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                        <CheckCircle size={12} />
                        Approved
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button 
            variant="outline" 
            onClick={handleApproveAll}
            className="w-full"
          >
            Approve All Warnings
          </Button>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={selectedWarnings.size === 0}
          >
            Approve Selected ({selectedWarnings.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
