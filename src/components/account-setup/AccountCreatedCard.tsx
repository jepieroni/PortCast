
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const AccountCreatedCard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
            <CheckCircle className="h-8 w-8" />
            Account Created!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your account has been successfully created. You will be redirected to sign in shortly.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Sign In Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountCreatedCard;
