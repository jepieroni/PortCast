
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ApprovalResult = () => {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    action: string;
  } | null>(null);

  useEffect(() => {
    const success = searchParams.get('success') === 'true';
    const message = searchParams.get('message') || 'Unknown result';
    const action = searchParams.get('action') || 'unknown';

    setResult({ success, message, action });
  }, [searchParams]);

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 text-yellow-600" size={48} />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isApproval = result.action === 'approve';
  const Icon = result.success ? CheckCircle : XCircle;
  const iconColor = result.success ? 'text-green-600' : 'text-red-600';
  const statusText = result.success 
    ? (isApproval ? 'Request Approved' : 'Request Denied')
    : 'Error Processing Request';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Icon className={`mx-auto mb-4 ${iconColor}`} size={64} />
          <CardTitle className="text-2xl">PortCast User Request</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className={`text-xl font-semibold ${iconColor}`}>
            {statusText}
          </div>
          <div className="text-gray-700">
            {result.message}
          </div>
          {result.success && isApproval && (
            <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
              The user will be notified that their account has been approved and they can now sign in.
            </div>
          )}
          {result.success && !isApproval && (
            <div className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg">
              The user will be notified that their request was denied.
            </div>
          )}
          <Button asChild className="w-full mt-6">
            <Link to="/">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalResult;
