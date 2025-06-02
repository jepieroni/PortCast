
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Trash2, Search } from 'lucide-react';
import { Port } from '@/components/shipment-registration/types';

interface PortListProps {
  ports: Port[];
  getPortRegion: (portId: string) => any;
  handleEdit: (port: any) => void;
  handleDelete: (portId: string) => Promise<void>;
}

const PortList = ({ ports, getPortRegion, handleEdit, handleDelete }: PortListProps) => {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredPorts = ports.filter(port => {
    const searchTerm = searchFilter.toLowerCase();
    return port.name.toLowerCase().includes(searchTerm) ||
           port.code.toLowerCase().includes(searchTerm) ||
           (port.description && port.description.toLowerCase().includes(searchTerm));
  });

  return (
    <Card className="max-h-[500px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Existing Ports</CardTitle>
          <div className="flex items-center gap-2">
            <Search size={16} className="text-gray-500" />
            <Input
              placeholder="Search ports..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[350px] px-6 pb-6">
          <div className="space-y-1">
            {filteredPorts.map((port) => {
              const region = getPortRegion(port.id);
              return (
                <div key={port.id} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{port.name} ({port.code})</div>
                    {port.description && (
                      <div className="text-xs text-gray-500 truncate mb-1">
                        {port.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 truncate">
                      Rate Area: {port.rate_area_id || 'None'} | 
                      Region: {region?.name || 'None'}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(port)} className="h-7 w-7 p-0">
                      <Edit size={12} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(port.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredPorts.length === 0 && (
              <div className="text-center text-gray-500 py-4 text-sm">
                {searchFilter ? 'No ports found matching your search.' : 'No ports found.'}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PortList;
