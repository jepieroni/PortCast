
import { ReactNode } from 'react';
import Header from '@/components/Header';

interface AppLayoutProps {
  children: ReactNode;
  isGlobalAdmin: boolean;
  isOrgAdmin: boolean;
  loading: boolean;
  user: any;
  onAddShipment: () => void;
  onAdmin: () => void;
  onSignOut: () => void;
}

const AppLayout = ({
  children,
  isGlobalAdmin,
  isOrgAdmin,
  loading,
  user,
  onAddShipment,
  onAdmin,
  onSignOut,
}: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header
        isGlobalAdmin={isGlobalAdmin}
        isOrgAdmin={isOrgAdmin}
        loading={loading}
        user={user}
        onAddShipment={onAddShipment}
        onAdmin={onAdmin}
        onSignOut={onSignOut}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
