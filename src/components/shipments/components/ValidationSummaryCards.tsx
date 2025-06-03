
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ValidationSummaryCardsProps {
  validationSummary: {
    valid: number;
    invalid: number;
    pending: number;
  };
}

const ValidationSummaryCards = ({ validationSummary }: ValidationSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-2xl font-bold text-green-600">{validationSummary.valid}</span>
          </div>
          <p className="text-sm text-gray-600">Valid Records</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <XCircle size={20} className="text-red-600" />
            <span className="text-2xl font-bold text-red-600">{validationSummary.invalid}</span>
          </div>
          <p className="text-sm text-gray-600">Invalid Records</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-yellow-600" />
            <span className="text-2xl font-bold text-yellow-600">{validationSummary.pending}</span>
          </div>
          <p className="text-sm text-gray-600">Pending Validation</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationSummaryCards;
