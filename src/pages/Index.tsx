
import Auth from '@/components/Auth';
import LoadingScreen from '@/components/LoadingScreen';
import AppLayout from '@/components/AppLayout';
import ViewRouter from '@/components/ViewRouter';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/hooks/useNavigation';

const Index = () => {
  const { user, loading, isGlobalAdmin, isOrgAdmin, handleSignOut } = useAuth();
  const {
    currentView,
    outlookDays,
    setOutlookDays,
    navigateTo,
    goToMain,
    goToRegistration,
    goToAdmin,
  } = useNavigation();

  // Show loading while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Show auth form if not logged in
  if (!user) {
    return <Auth onSuccess={goToMain} />;
  }

  const handleSignOutAndReset = async () => {
    await handleSignOut();
    goToMain();
  };

  return (
    <AppLayout
      isGlobalAdmin={isGlobalAdmin}
      isOrgAdmin={isOrgAdmin}
      loading={loading}
      user={user}
      onAddShipment={goToRegistration}
      onAdmin={goToAdmin}
      onSignOut={handleSignOutAndReset}
    >
      <ViewRouter
        currentView={currentView}
        outlookDays={outlookDays}
        onOutlookDaysChange={setOutlookDays}
        onNavigate={navigateTo}
        onBack={goToMain}
      />
    </AppLayout>
  );
};

export default Index;
