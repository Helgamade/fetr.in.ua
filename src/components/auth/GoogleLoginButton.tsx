import { Button } from '@/components/ui/button';
import { authAPI } from '@/lib/api';
import { Chrome } from 'lucide-react';

interface GoogleLoginButtonProps {
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary' | 'destructive';
  children?: React.ReactNode;
}

export function GoogleLoginButton({ 
  className, 
  size = 'default',
  variant = 'outline',
  children 
}: GoogleLoginButtonProps) {
  const handleGoogleLogin = () => {
    authAPI.googleLogin();
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      variant={variant}
      size={size}
      className={className}
    >
      <Chrome className="mr-2 h-4 w-4" />
      {children || 'Увійти через Google'}
    </Button>
  );
}

