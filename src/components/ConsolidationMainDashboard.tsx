
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ship, ArrowLeft } from 'lucide-react';
import { consolidationDashboardCards } from '@/data/mockData';

interface ConsolidationMainDashboardProps {
  onCardClick: (cardId: string) => void;
  onBack: () => void;
}

const ConsolidationMainDashboard = ({ onCardClick, onBack }: ConsolidationMainDashboardProps) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">Consolidation Dashboard</h2>
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Consolidation Management</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Monitor and optimize shipment consolidation opportunities across all routes
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {consolidationDashboardCards.map((card) => (
          <Card 
            key={card.id} 
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
            onClick={() => onCardClick(card.id)}
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
};

export default ConsolidationMainDashboard;
