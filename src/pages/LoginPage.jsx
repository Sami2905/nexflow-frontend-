import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/nexflow-logo.svg';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('token', data.token);
      navigate('/'); // Redirect to dashboard on successful login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md p-8 space-y-8 bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg animate-fade-in-fast">
        <div className="text-center">
          <img src={logo} alt="Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Sign in to NexFlow</h1>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-danger/20 text-danger rounded-md text-sm">{error}</div>}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field rounded-t-md"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input-field rounded-b-md"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <HiEyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <HiEye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-primary/50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <p className="mt-2 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          New here?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary/90">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
// Helper CSS class for inputs, you might want to move this to your index.css
const styles = `
.input-field {
  appearance: none;
  background-color: transparent;
  border: 1px solid var(--color-border);
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  color: var(--color-text-primary);
  position: relative;
  z-index: 10;
}
.input-field:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  border-color: var(--color-primary);
  z-index: 20;
}
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet); 