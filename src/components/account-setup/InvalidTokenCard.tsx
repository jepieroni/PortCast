
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const InvalidTokenCard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">Invalid Token</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            This account setup link is invalid or has expired. Please request a new access approval.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvalidTokenCard;
