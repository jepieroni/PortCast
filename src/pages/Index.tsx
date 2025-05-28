
import { useState } from 'react';
import { Ship } from 'lucide-react';
import ShipmentRegistration from '@/components/ShipmentRegistration';
import AdminDashboard from '@/components/AdminDashboard';
import Auth from '@/components/Auth';
import Header from '@/components/Header';
import MainDashboard from '@/components/MainDashboard';
import ConsolidationDashboard from '@/components/ConsolidationDashboard';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading, isGlobalAdmin, handleSignOut } = useAuth();
  const [currentView, setCurrentView] = useState<'main' | 'inbound' | 'outbound' | 'intertheater' | 'registration' | 'admin'>('main');
  const [outlookDays, setOutlookDays] = useState([7]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Ship className="mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return <Auth onSuccess={() => setCurrentView('main')} />;
  }

  const handleSignOutAndReset = async () => {
    await handleSignOut();
    setCurrentView('main');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header
        isGlobalAdmin={isGlobalAdmin}
        loading={loading}
        onAddShipment={() => setCurrentView('registration')}
        onAdmin={() => setCurrentView('admin')}
        onSignOut={handleSignOutAndReset}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'main' && (
          <MainDashboard onCardClick={(cardId) => setCurrentView(cardId as any)} />
        )}
        {currentView === 'registration' && (
          <ShipmentRegistration onBack={() => setCurrentView('main')} />
        )}
        {currentView === 'admin' && (
          <AdminDashboard onBack={() => setCurrentView('main')} />
        )}
        {(currentView === 'inbound' || currentView === 'outbound' || currentView === 'intertheater') && (
          <ConsolidationDashboard
            type={currentView}
            outlookDays={outlookDays}
            onOutlookDaysChange={setOutlookDays}
            onBack={() => setCurrentView('main')}
            onTabChange={(tab) => setCurrentView(tab as any)}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
