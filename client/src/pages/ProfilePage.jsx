import { useWorkspace } from '../hooks/useAuth';
import AppHeader from '../components/navigation/AppHeader';
import UserProfile from '../components/profile/UserProfile';

export default function ProfilePage() {
  const { conversation } = useWorkspace();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader project={conversation?.project} title="Profile" />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-xl p-4 sm:p-6 lg:p-8">
          <h1 className="mb-5 text-2xl font-bold text-navy-900">Profile</h1>
          <UserProfile />
        </div>
      </div>
    </div>
  );
}
