import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, Code } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isDeveloperMode) {
        // Handle developer login
        const response = await fetch('/api/dev-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || 'Nieprawidłowe dane developera');
          return;
        }

        const data = await response.json();
        console.log('Developer zalogowany:', data);
        window.location.reload();
      } else if (isLogin) {
        // Handle login
        const response = await fetch('/api/email-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || 'Błąd logowania');
          return;
        }

        const data = await response.json();
        console.log('Zalogowano pomyślnie:', data);
        window.location.reload(); // Odśwież stronę po zalogowaniu
      } else {
        // Handle registration
        if (!firstName.trim()) {
          setError('Imię jest wymagane');
          return;
        }
        if (!lastName.trim()) {
          setError('Nazwisko jest wymagane');
          return;
        }

        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            password, 
            firstName: firstName.trim(), 
            lastName: lastName.trim() 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || 'Błąd podczas rejestracji');
          return;
        }

        const data = await response.json();
        console.log('Zarejestrowano pomyślnie:', data);
        // Po udanej rejestracji przełącz na logowanie
        setIsLogin(true);
        setError('');
        setPassword('');
        alert('Konto zostało utworzone! Możesz się teraz zalogować.');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Błąd połączenia z serwerem');
    }
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
            {isDeveloperMode 
              ? 'Dostęp dla deweloperów' 
              : isLogin 
                ? 'Zaloguj się, aby uzyskać dostęp do narzędzi optymalizacji CV'
                : 'Dołącz do tysięcy użytkowników optymalizujących swoje CV z AI'
            }
          </p>

          {/* Developer mode toggle */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setIsDeveloperMode(!isDeveloperMode);
                setEmail('');
                setPassword('');
                setError('');
              }}
              className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Code className="w-3 h-3 mr-1" />
              {isDeveloperMode ? 'Tryb użytkownika' : 'Tryb developera'}
            </button>
          </div>

          {!isLogin && !isDeveloperMode && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Imię *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required={!isLogin}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Jan"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nazwisko *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required={!isLogin}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Kowalski"
                  />
                </div>
              </div>
            </>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDeveloperMode ? 'Nazwa użytkownika *' : 'Email *'}
            </label>
            <input
              type={isDeveloperMode ? "text" : "email"}
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={isDeveloperMode ? "developer" : "jan.kowalski@email.com"}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hasło * {!isLogin && <span className="text-xs text-gray-500">(minimum 6 znaków)</span>}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={isLogin ? "Wprowadź hasło" : "Minimum 6 znaków"}
            />
          </div>

          {error && <p className="text-center text-red-500 text-sm">{error}</p>}

          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:shadow-lg transition-all duration-300"
            data-testid="button-auth-submit"
          >
            {isDeveloperMode 
              ? 'Zaloguj jako Developer' 
              : isLogin 
                ? 'Zaloguj się' 
                : 'Utwórz konto'
            }
          </Button>

          {!isDeveloperMode && (
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
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}