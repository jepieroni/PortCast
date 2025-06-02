
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';

interface RateArea {
  id: string;
  rate_area: string;
  name: string;
  is_conus: boolean;
  countries?: {
    name: string;
  };
}

interface PortRegion {
  id: string;
  name: string;
}

interface RateAreaListProps {
  rateAreas: RateArea[];
  getRateAreaRegion: (rateAreaId: string) => PortRegion | null;
  onEdit: (rateArea: RateArea) => void;
  onDelete: (rateAreaId: string) => void;
}

const RateAreaList = ({
  rateAreas,
  getRateAreaRegion,
  onEdit,
  onDelete
}: RateAreaListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Rate Areas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {rateAreas.map((rateArea) => {
            const region = getRateAreaRegion(rateArea.rate_area);
            return (
              <div key={rateArea.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{rateArea.rate_area}</div>
                  <div className="text-sm text-gray-600">
                    {rateArea.name} | {rateArea.countries?.name} | 
                    {rateArea.is_conus ? ' CONUS' : ' Non-CONUS'}
                  </div>
                  {region && (
                    <div className="text-xs text-blue-600">
                      Region: {region.name}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(rateArea)}>
                    <Edit size={14} />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => onDelete(rateArea.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RateAreaList;
