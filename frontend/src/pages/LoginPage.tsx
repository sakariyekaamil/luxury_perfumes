import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store';
import { authApi } from '@/lib/api';
import { isValidRole } from '@/lib/roles';
import { toast } from '@/lib/toast';

const REMEMBER_EMAIL_KEY = 'luxury-erp-remember-email';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

function SystemOverview() {
  return (
    <div className="w-full max-w-md px-4 text-white pb-4">
      <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight mb-4">
        Manage your <span className="text-gold">luxury perfume</span> business
      </h2>
      <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
        One platform to run daily operations — from stock and sales to purchases,
        payments, and performance reports for your fragrance store.
      </p>
    </div>
  );
}

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, data.email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      const response = await authApi.login(data.email, data.password);
      const { user, accessToken, refreshToken } = response.data.data;
      if (!isValidRole(user.role)) {
        toast.error('Your account role is not recognized.');
        return;
      }
      setAuth(user, accessToken, refreshToken);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
        code?: string;
      };
      if (!axiosError.response) {
        toast.error('Cannot reach the server. Start the backend with: npm run dev (in the backend folder).');
      } else {
        toast.error(axiosError.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-8">
      <div className="flex w-full max-w-5xl min-h-[600px] shadow-2xl rounded-tl-[48px] rounded-br-[48px] overflow-hidden bg-white">
        {/* Left panel — brand primary */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary-900 flex-col justify-between p-10 relative overflow-hidden">
          <div className="relative z-10 flex-1 flex items-end justify-start pt-16 pb-24">
            <SystemOverview />
          </div>
          <div className="relative z-10 text-center space-y-4 pb-2">
            <div className="flex justify-center gap-5">
              {['facebook', 'linkedin', 'instagram'].map((social) => (
                <button
                  key={social}
                  type="button"
                  className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-gold/90 hover:bg-gold/10 transition-colors"
                  aria-label={social}
                >
                  <span className="text-xs font-bold uppercase">{social[0]}</span>
                </button>
              ))}
            </div>
            <p className="text-slate-400 text-xs">© Luxury Perfumes. All rights reserved.</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-12 py-10 bg-white">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <span className="font-display font-bold text-xl text-primary-900">Luxury Perfumes</span>
            </div>

            {/* Logo */}
            <div className="mb-6 hidden lg:block">
              <span className="font-display text-2xl font-bold text-primary-900 tracking-tight">
                Luxury Perfumes
              </span>
            </div>

            <h1 className="text-3xl font-bold text-primary-900 mb-8">Sign in</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="login-email" className="luxury-label">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@luxuryperfumes.com"
                    className="luxury-input pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" className="luxury-label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="luxury-input pl-10 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-900 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-gold focus:ring-gold"
                  />
                  <span className="text-sm text-slate-600">Remember email</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-primary-800 hover:text-gold transition-colors"
                  onClick={() => toast.info('Contact your system administrator to reset your password.')}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-400 text-primary-900 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <p className="text-center text-xs text-slate-400">
                Staff access — Luxury Perfumes ERP
              </p>
            </form>

            <div className="mt-10 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap gap-3 justify-center">
                {['Google', 'Facebook', 'LinkedIn'].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-gold/40 hover:bg-gold/5 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary-900/5 flex items-center justify-center text-[10px] font-bold text-primary-700">
                      {provider[0]}
                    </span>
                    Sign in with {provider}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
