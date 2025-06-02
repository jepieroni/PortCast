
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ShipmentTableLoadingProps {
  rows?: number;
}

export const ShipmentTableLoading = ({ rows = 5 }: ShipmentTableLoadingProps) => (
  <div className="space-y-4">
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);

interface ShipmentTableErrorProps {
  error: any;
  onRetry: () => void;
}

export const ShipmentTableError = ({ error, onRetry }: ShipmentTableErrorProps) => (
  <div className="text-center py-12">
    <p className="text-red-600 mb-4">Error loading shipments</p>
    <p className="text-gray-500">{error.message}</p>
    <Button onClick={onRetry} className="mt-4">Try Again</Button>
  </div>
);

export const ShipmentTableEmpty = () => (
  <div className="text-center py-12">
    <p className="text-gray-500 text-lg">No shipments found</p>
    <p className="text-gray-400">Add some shipments to get started</p>
  </div>
);
