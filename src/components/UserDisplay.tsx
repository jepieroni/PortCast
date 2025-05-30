
import { User } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

interface UserDisplayProps {
  user: any;
}

const UserDisplay = ({ user }: UserDisplayProps) => {
  const { profile, loading } = useUserProfile(user);

  if (loading || !profile) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <User size={20} />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  const displayName = fullName || 'User';

  return (
    <div className="flex items-center gap-2 text-gray-700">
      <User size={20} className="text-gray-500" />
      <div className="text-sm">
        <div className="font-medium">{displayName}</div>
        {profile.organization_name && (
          <div className="text-xs text-gray-500">{profile.organization_name}</div>
        )}
      </div>
    </div>
  );
};

export default UserDisplay;
