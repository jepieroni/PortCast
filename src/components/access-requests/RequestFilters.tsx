
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RequestFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

const RequestFilters = ({ statusFilter, onStatusFilterChange }: RequestFiltersProps) => {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium">Filter by status:</label>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Requests</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="denied">Denied</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default RequestFilters;
