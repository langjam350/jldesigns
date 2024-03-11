import Link from 'next/link'
import AuthService from '@/services/AuthService';
import dynamic from 'next/dynamic';

const DynamicLink = dynamic(() => import('next/link'), { ssr: false });

const Button = () => {
  const isAuthenticated = AuthService.isAuthenticated();
  const userEmail = AuthService.getUserEmail();

  return (
    <div>
       {isAuthenticated ? (
        <DynamicLink href="/" className="rounded-lg flex items-center justify-center h-12 font-bold px-5">
            Signed In As {userEmail}
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