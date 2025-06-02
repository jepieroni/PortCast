
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Auth from '@/components/Auth';
import LoadingScreen from '@/components/LoadingScreen';
import AppLayout from '@/components/AppLayout';
import ViewRouter from '@/components/ViewRouter';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/hooks/useNavigation';

const Index = () => {
  const location = useLocation();
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

  useEffect(() => {
    // Check if we need to navigate to a specific view after coming from edit
    if (location.state?.navigateTo) {
      navigateTo(location.state.navigateTo);
      // Clear the state to prevent repeated navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, navigateTo]);

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
      currentView={currentView}
      onAdmin={goToAdmin}
      onSignOut={handleSignOutAndReset}
    >
      <ViewRouter
        currentView={currentView}
        outlookDays={outlookDays}
        onOutlookDaysChange={setOutlookDays}
        onNavigate={navigateTo}
        onBack={goToMain}
        onAddShipment={goToRegistration}
      />
    </AppLayout>
  );
};

export default Index;
