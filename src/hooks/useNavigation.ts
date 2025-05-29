
import { useState } from 'react';

export type ViewType = 'main' | 'inbound' | 'outbound' | 'intertheater' | 'registration' | 'admin';

export const useNavigation = () => {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [outlookDays, setOutlookDays] = useState([7]);

  const navigateTo = (view: ViewType) => {
    setCurrentView(view);
  };

  const goToMain = () => setCurrentView('main');
  const goToRegistration = () => setCurrentView('registration');
  const goToAdmin = () => setCurrentView('admin');

  return {
    currentView,
    outlookDays,
    setOutlookDays,
    navigateTo,
    goToMain,
    goToRegistration,
    goToAdmin,
  };
};
