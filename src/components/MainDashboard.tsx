
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ship } from 'lucide-react';
import { mainDashboardCards } from '@/data/mockData';

interface MainDashboardProps {
  onCardClick: (cardId: string) => void;
}

const MainDashboard = ({ onCardClick }: MainDashboardProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">PortCast</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Worldwide HHG Consolidator - Your trusted platform for international shipment consolidation
        </p>
      </div>
      
      <div className="flex justify-center">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          {mainDashboardCards.map((card) => (
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
    </div>
  );
};

export default MainDashboard;
