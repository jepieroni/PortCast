
import { Card, CardContent } from '@/components/ui/card';

const TokenValidatingCard = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating setup token...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenValidatingCard;
