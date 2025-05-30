
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ship, Plus, MessageSquare, LogOut, Settings, Bell } from 'lucide-react';
import { usePendingRequests } from '@/hooks/usePendingRequests';

interface HeaderProps {
  isGlobalAdmin: boolean;
  isOrgAdmin: boolean;
  loading: boolean;
  onAddShipment: () => void;
  onAdmin: () => void;
  onSignOut: () => void;
}

const Header = ({ isGlobalAdmin, isOrgAdmin, loading, onAddShipment, onAdmin, onSignOut }: HeaderProps) => {
  const { hasPendingRequests } = usePendingRequests();
  const isAnyAdmin = isGlobalAdmin || isOrgAdmin;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Ship className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-900">PortCast</span>
            {isGlobalAdmin && <Badge variant="destructive" className="ml-2">GLOBAL ADMIN</Badge>}
            {isOrgAdmin && !isGlobalAdmin && <Badge variant="default" className="ml-2">ORG ADMIN</Badge>}
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
            {isAnyAdmin && (
              <Button 
                variant="outline" 
                onClick={onAdmin}
                className={`${isGlobalAdmin ? 'border-red-500 text-red-600 hover:bg-red-50' : 'border-blue-500 text-blue-600 hover:bg-blue-50'} relative`}
              >
                <Settings size={16} className="mr-2" />
                Admin
                {isGlobalAdmin && hasPendingRequests && (
                  <Bell 
                    size={16} 
                    className="absolute -top-1 -right-1 text-red-600 fill-red-600 animate-[ring_4s_ease-in-out_infinite]" 
                  />
                )}
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
