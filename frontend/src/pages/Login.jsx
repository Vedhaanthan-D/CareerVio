import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const { register, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Successfully logged in!');
    } catch (err) {
      toast.error(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-bg-primary">
      <div className="w-full max-w-[440px] bg-bg-card border border-border-color rounded-xl p-6 shadow-lg hover:border-accent/20 transition-colors duration-200">
        <div className="text-center mb-7">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-black font-extrabold mx-auto mb-4">
            <LogIn size={24} />
          </div>
          <h2 className="text-2xl font-bold font-heading text-text-primary mb-2">Welcome Back</h2>
          <p className="text-sm text-text-secondary">Login to continue your placement preparation journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex flex-col items-start w-full">
            <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="email">
              Email Address <span className="text-error font-semibold">*</span>
            </label>
            <div className="relative w-full">
              <Mail size={16} className="absolute left-3 top-3.5 text-text-secondary" />
              <input
                id="email"
                type="email"
                className="w-full px-3.5 py-2.5 pl-9.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary placeholder:text-neutral-700 focus:outline-none focus:border-accent transition duration-200"
                placeholder="you@college.edu"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-error mt-1.5 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col items-start w-full">
            <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="password">
              Password <span className="text-error font-semibold">*</span>
            </label>
            <div className="relative w-full">
              <Lock size={16} className="absolute left-3 top-3.5 text-text-secondary" />
              <input
                id="password"
                type="password"
                className="w-full px-3.5 py-2.5 pl-9.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary placeholder:text-neutral-700 focus:outline-none focus:border-accent transition duration-200"
                placeholder="••••••••"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-error mt-1.5 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-2 h-11 flex items-center justify-center gap-2 font-heading font-semibold text-sm text-black bg-accent hover:bg-accent-hover rounded-lg transition duration-200 disabled:bg-border-color disabled:text-text-secondary disabled:cursor-not-allowed cursor-pointer"
            disabled={loading || !isValid}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent font-medium hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
