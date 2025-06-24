import Link from 'next/link'
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const DynamicLink = dynamic(() => import('next/link'), { ssr: false });

const Button = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="rounded-lg flex items-center justify-center h-12 font-bold px-5">
        Loading...
      </div>
    );
  }

  return (
    <div>
       {user ? (
        <DynamicLink href="/" className="rounded-lg flex items-center justify-center h-12 font-bold px-5">
            Signed In As {user.email}
        </DynamicLink>
      ) : (
        <DynamicLink href="/signin" className="rounded-lg flex items-center justify-center h-12 bg-white font-bold px-5">
            Sign In
        </DynamicLink>
      )}
    </div>
  );
    
};
export default Button;