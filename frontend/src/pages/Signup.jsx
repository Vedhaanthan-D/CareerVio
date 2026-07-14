import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserPlus, User, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const signupSchema = z.object({
  fullName: z.string().min(1, "Full Name is required").max(100, "Full Name is too long"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Confirm password is required")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' }
  });

  const passwordValue = watch('password') || '';
  const hasMinLength = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasLower = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);
  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  useEffect(() => {
    let timeoutId;
    if (isRegistered) {
      timeoutId = setTimeout(() => {
        navigate('/login');
      }, 6000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRegistered, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setVerifyEmail(data.email);

    try {
      await signUp(data.email, data.password, data.fullName);
      toast.success(`Account created! Verification email sent to ${data.email}. Please check your inbox.`, {
        duration: 6000
      });
      setIsRegistered(true);
    } catch (err) {
      toast.error(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthUI = () => {
    if (!passwordValue) return null;
    let label = 'Weak';
    let colorClass = 'bg-error';
    if (strengthScore >= 4) {
      label = 'Strong';
      colorClass = 'bg-success';
    } else if (strengthScore >= 2) {
      label = 'Medium';
      colorClass = 'bg-accent';
    }

    return (
      <div className="w-full mt-2">
        <div className="flex justify-between items-center text-[10px] font-semibold mb-1">
          <span className="text-text-secondary">Password Strength:</span>
          <span className={strengthScore >= 4 ? 'text-success' : strengthScore >= 2 ? 'text-accent' : 'text-error'}>
            {label} ({strengthScore}/5)
          </span>
        </div>
        <div className="h-1 bg-bg-secondary rounded-full overflow-hidden flex gap-0.5">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx <= strengthScore ? colorClass : 'bg-neutral-800'
              }`}
            />
          ))}
        </div>
        <div className="text-[10px] text-text-secondary mt-1.5 leading-normal space-y-0.5">
          <p className={hasMinLength ? 'text-success/80' : 'text-text-secondary'}>✓ Min 8 characters</p>
          <p className={hasUpper ? 'text-success/80' : 'text-text-secondary'}>✓ One uppercase letter</p>
          <p className={hasLower ? 'text-success/80' : 'text-text-secondary'}>✓ One lowercase letter</p>
          <p className={hasNumber ? 'text-success/80' : 'text-text-secondary'}>✓ One number</p>
          <p className={hasSpecial ? 'text-success/80' : 'text-text-secondary'}>✓ One special character</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-bg-primary">
      <div className="w-full max-w-[440px] bg-bg-card border border-border-color rounded-xl p-6 shadow-lg hover:border-accent/20 transition-colors duration-200">
        {isRegistered ? (
          <div className="text-center py-3">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-bold font-heading text-text-primary mb-3">Verify Your Email</h2>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              We have sent a verification link to <strong className="text-text-primary font-semibold">{verifyEmail}</strong>. Please check your inbox and verify your account.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-11 flex items-center justify-center gap-2 font-heading font-semibold text-sm text-black bg-accent hover:bg-accent-hover rounded-lg transition duration-200 cursor-pointer"
            >
              Go to Login
              <ArrowRight size={16} />
            </button>
            <p className="text-xs text-text-secondary/50 mt-4">
              Redirecting to login automatically in 6 seconds...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-7">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-black font-extrabold mx-auto mb-4">
                <UserPlus size={24} />
              </div>
              <h2 className="text-2xl font-bold font-heading text-text-primary mb-2">Create Account</h2>
              <p className="text-sm text-text-secondary">Get started with your custom placement preparation roadmap</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex flex-col items-start w-full">
                <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="fullName">
                  Full Name <span className="text-error font-semibold">*</span>
                </label>
                <div className="relative w-full">
                  <User size={16} className="absolute left-3 top-3.5 text-text-secondary" />
                  <input
                    id="fullName"
                    type="text"
                    className="w-full px-3.5 py-2.5 pl-9.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary placeholder:text-neutral-700 focus:outline-none focus:border-accent transition duration-200"
                    placeholder="John Doe"
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-error mt-1.5 font-medium">{errors.fullName.message}</p>
                )}
              </div>

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
                    placeholder="Min. 8 characters"
                    {...register('password')}
                  />
                </div>
                {getStrengthUI()}
                {errors.password && (
                  <p className="text-xs text-error mt-1.5 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div className="flex flex-col items-start w-full">
                <label className="block text-xs font-semibold font-heading text-text-primary mb-2" htmlFor="confirmPassword">
                  Confirm Password <span className="text-error font-semibold">*</span>
                </label>
                <div className="relative w-full">
                  <Lock size={16} className="absolute left-3 top-3.5 text-text-secondary" />
                  <input
                    id="confirmPassword"
                    type="password"
                    className="w-full px-3.5 py-2.5 pl-9.5 bg-bg-secondary border border-border-color rounded-lg text-sm text-text-primary placeholder:text-neutral-700 focus:outline-none focus:border-accent transition duration-200"
                    placeholder="Re-enter password"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-error mt-1.5 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full mt-2 h-11 flex items-center justify-center gap-2 font-heading font-semibold text-sm text-black bg-accent hover:bg-accent-hover rounded-lg transition duration-200 disabled:bg-border-color disabled:text-text-secondary disabled:cursor-not-allowed cursor-pointer"
                disabled={loading || !isValid}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="text-center mt-6 text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-medium hover:underline">
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
