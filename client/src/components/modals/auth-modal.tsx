import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
      // Handle login
      console.log("Logging in with:", email, password);
      // Replace with actual login API call
      // Example: const response = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      // if (!response.ok) { setError('Invalid email or password'); }
    } else {
      // Handle registration
      console.log("Registering with:", email, password);
      // Replace with actual registration API call
      // Example: const response = await fetch('/api/register', { method: 'POST', body: JSON.stringify({ email, password }) });
      // if (!response.ok) { setError('Email already in use or other error'); }
    }
    // If successful, close modal or redirect
    // onClose(); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-center text-muted-foreground">
            {isLogin 
              ? 'Sign in to access your CV optimization tools'
              : 'Join thousands of users optimizing their CVs with AI'
            }
          </p>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {error && <p className="text-center text-red-500 text-sm">{error}</p>}

          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:shadow-lg transition-all duration-300"
            data-testid="button-auth-submit"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary-500 hover:underline"
            >
              {isLogin 
                ? 'Nie masz konta? Utwórz je tutaj'
                : 'Masz już konto? Zaloguj się'
              }
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}