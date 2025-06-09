
import { useState } from 'react';

export type ViewType = 'main' | 'shipments' | 'consolidation' | 'inbound' | 'outbound' | 'intertheater' | 'registration' | 'admin' | 'consolidation-details';

export const useNavigation = () => {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [outlookDays, setOutlookDays] = useState<number[]>([7]);
  const [consolidationParams, setConsolidationParams] = useState<any>(null);

  const navigateTo = (view: ViewType, params?: any) => {
    setCurrentView(view);
    if (view === 'consolidation-details' && params) {
      setConsolidationParams(params);
    }
  };

  const goToMain = () => {
    setCurrentView('main');
    setConsolidationParams(null);
  };
  
  const goToRegistration = () => setCurrentView('registration');
  const goToAdmin = () => setCurrentView('admin');
  const goToShipments = () => setCurrentView('shipments');
  const goToConsolidation = () => setCurrentView('consolidation');

  return {
    currentView,
    outlookDays,
    consolidationParams,
    setOutlookDays,
    navigateTo,
    goToMain,
    goToRegistration,
    goToAdmin,
    goToShipments,
    goToConsolidation,
  };
};
