
import { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ViewType } from '@/hooks/useNavigation';

interface AppLayoutProps {
  children: ReactNode;
  isGlobalAdmin: boolean;
  isOrgAdmin: boolean;
  loading: boolean;
  user: any;
  currentView: ViewType;
  onAdmin: () => void;
  onSignOut: () => void;
}

const AppLayout = ({
  children,
  isGlobalAdmin,
  isOrgAdmin,
  loading,
  user,
  currentView,
  onAdmin,
  onSignOut,
}: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <Header
        isGlobalAdmin={isGlobalAdmin}
        isOrgAdmin={isOrgAdmin}
        loading={loading}
        user={user}
        currentView={currentView}
        onAdmin={onAdmin}
        onSignOut={onSignOut}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
