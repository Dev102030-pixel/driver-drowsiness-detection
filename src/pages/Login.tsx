import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { login } from '@/lib/auth';

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const session = login(username, password);
    if (session) {
      if (session.role === 'admin') {
        navigate('/admin/reports');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-gradient-to-br from-sky-500 to-cyan-600 px-8 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Guardian Vision</h1>
          <p className="mt-2 text-sky-100">Driver Monitoring System</p>
        </div>

        <div className="px-8 py-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Enter password"
                required
              />
            </div>
            
            {error && <p className="text-sm font-medium text-red-500">{error}</p>}

            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Demo Credentials:</p>
            <ul className="mt-2 space-y-1">
              <li><span className="font-medium text-slate-700">Admin:</span> admin / admin</li>
              <li><span className="font-medium text-slate-700">Driver:</span> driver1 / driver1</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
