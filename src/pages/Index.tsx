import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Ship, Plus, MessageSquare, ArrowLeft, LogOut, Settings } from 'lucide-react';
import ShipmentRegistration from '@/components/ShipmentRegistration';
import ConsolidationCard from '@/components/ConsolidationCard';
import AdminDashboard from '@/components/AdminDashboard';
import Auth from '@/components/Auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<'main' | 'inbound' | 'outbound' | 'intertheater' | 'registration' | 'admin'>('main');
  const [outlookDays, setOutlookDays] = useState([7]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setIsGlobalAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      setIsGlobalAdmin(roleData?.role === 'global_admin');
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsGlobalAdmin(false);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      // Clear local state first to provide immediate feedback
      setUser(null);
      setIsGlobalAdmin(false);
      setCurrentView('main');
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        // Even if there's an error, we've already cleared local state
        // This handles cases where the session is already invalid on the server
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      // Still show success since we've cleared local state
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    }
  };

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

  const mainDashboardCards = [
    { id: 'inbound', title: 'Inbound', description: 'OCONUS to CONUS shipments', color: 'bg-blue-600' },
    { id: 'outbound', title: 'Outbound', description: 'CONUS to OCONUS shipments', color: 'bg-emerald-600' },
    { id:'intertheater', title: 'Intertheater', description: 'OCONUS to OCONUS shipments', color: 'bg-purple-600' }
  ];

  const mockConsolidationData = {
    inbound: [
      { country: 'Japan', totalCube: 850, poe: 'Norfolk', availableShipments: 12, hasUserShipments: true },
      { country: 'Germany', totalCube: 1200, poe: 'Baltimore', availableShipments: 8, hasUserShipments: false },
      { country: 'Italy', totalCube: 450, poe: 'Savannah', availableShipments: 6, hasUserShipments: true }
    ],
    outbound: [
      { country: 'South Korea', totalCube: 950, poe: 'Tacoma', availableShipments: 15, hasUserShipments: true },
      { country: 'United Kingdom', totalCube: 680, poe: 'Norfolk', availableShipments: 9, hasUserShipments: false },
      { country: 'Spain', totalCube: 320, poe: 'Jacksonville', availableShipments: 4, hasUserShipments: false }
    ],
    intertheater: [
      { origin: 'Germany', destination: 'Japan', totalCube: 560, availableShipments: 7, hasUserShipments: true },
      { origin: 'Italy', destination: 'South Korea', totalCube: 380, availableShipments: 5, hasUserShipments: false }
    ]
  };

  const renderMainDashboard = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">PortCast</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Worldwide HHG Consolidator - Your trusted platform for international shipment consolidation
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {mainDashboardCards.map((card) => (
          <Card 
            key={card.id} 
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
            onClick={() => setCurrentView(card.id as any)}
          >
            <CardHeader className={`${card.color} text-white rounded-t-lg`}>
              <CardTitle className="flex items-center gap-2">
                <Ship size={24} />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <CardDescription className="text-gray-600 text-base">
                {card.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderConsolidationDashboard = (type: 'inbound' | 'outbound' | 'intertheater') => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setCurrentView('main')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold capitalize">{type} Consolidations</h2>
        </div>
        
        <div className="flex gap-2">
          {['inbound', 'outbound', 'intertheater'].map((tab) => (
            <Button
              key={tab}
              variant={type === tab ? 'default' : 'outline'}
              onClick={() => setCurrentView(tab as any)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Outlook Range:</span>
          <span className="text-sm text-gray-600">{outlookDays[0]} days</span>
        </div>
        <Slider
          value={outlookDays}
          onValueChange={setOutlookDays}
          max={28}
          min={0}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Current</span>
          <span>4 weeks</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {type === 'intertheater' 
          ? mockConsolidationData.intertheater.map((item, index) => (
              <ConsolidationCard
                key={index}
                title={`${item.origin} → ${item.destination}`}
                totalCube={item.totalCube}
                availableShipments={item.availableShipments}
                hasUserShipments={item.hasUserShipments}
                type="intertheater"
              />
            ))
          : mockConsolidationData[type].map((item, index) => (
              <ConsolidationCard
                key={index}
                title={item.country}
                subtitle={item.poe}
                totalCube={item.totalCube}
                availableShipments={item.availableShipments}
                hasUserShipments={item.hasUserShipments}
                type={type}
              />
            ))
        }
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                onClick={() => setCurrentView('registration')}
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
                  onClick={() => setCurrentView('admin')}
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <Settings size={16} className="mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut size={16} className="mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'main' && renderMainDashboard()}
        {currentView === 'registration' && <ShipmentRegistration onBack={() => setCurrentView('main')} />}
        {currentView === 'admin' && <AdminDashboard onBack={() => setCurrentView('main')} />}
        {(currentView === 'inbound' || currentView === 'outbound' || currentView === 'intertheater') && 
          renderConsolidationDashboard(currentView)}
      </main>
    </div>
  );
};

export default Index;
