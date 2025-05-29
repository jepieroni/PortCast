
import { Ship } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Ship className="mx-auto mb-4 text-blue-600" size={48} />
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
