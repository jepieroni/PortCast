
import { Card, CardContent } from '@/components/ui/card';

interface SummaryCardsProps {
  summary: {
    total: number;
    valid: number;
    invalid: number;
    pending: number;
  };
}

export const SummaryCards = ({ summary }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{summary.total}</div>
          <p className="text-sm text-gray-600">Total Records</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">{summary.valid}</div>
          <p className="text-sm text-gray-600">Valid</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-red-600">{summary.invalid}</div>
          <p className="text-sm text-gray-600">Invalid</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
          <p className="text-sm text-gray-600">Pending</p>
        </CardContent>
      </Card>
    </div>
  );
};
