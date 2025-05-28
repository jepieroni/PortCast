
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ship, Plus, MessageSquare, LogOut, Settings } from 'lucide-react';

interface HeaderProps {
  isGlobalAdmin: boolean;
  loading: boolean;
  onAddShipment: () => void;
  onAdmin: () => void;
  onSignOut: () => void;
}

const Header = ({ isGlobalAdmin, loading, onAddShipment, onAdmin, onSignOut }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Ship className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-900">PortCast</span>
            {isGlobalAdmin && <Badge variant="destructive" className="ml-2">ADMIN</Badge>}
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={onAddShipment}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={16} className="mr-2" />
              Add Shipment
            </Button>
            <Button variant="outline">
              <MessageSquare size={16} className="mr-2" />
              Forum
            </Button>
            {isGlobalAdmin && (
              <Button 
                variant="outline" 
                onClick={onAdmin}
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <Settings size={16} className="mr-2" />
                Admin
              </Button>
            )}
            <Button variant="outline" onClick={onSignOut} disabled={loading}>
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
