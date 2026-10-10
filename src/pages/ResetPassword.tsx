import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, ScanLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ThemeSelector from '../components/ThemeSelector';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLinkInvalid, setIsLinkInvalid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // Listen for Supabase PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setIsLinkInvalid(false);
        setError('');
        setLoading(false);
      }
    });

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (isMounted) {
            setIsLinkInvalid(false);
            setLoading(false);
          }
          return;
        }

        // If no session yet, check if there's a recovery hash or code in the URL
        const hash = window.location.hash;
        const search = window.location.search;
        const urlParams = new URLSearchParams(search);
        const code = urlParams.get('code');
        const tokenHash = urlParams.get('token_hash');
        const type = urlParams.get('type');

        // Handle PKCE code exchange (Supabase newer auth flow)
        if (code) {
          try {
            const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeErr) {
              if (isMounted) {
                setIsLinkInvalid(false);
                setLoading(false);
              }
              return;
            }
          } catch (e) {
            console.warn('[ResetPassword] exchangeCodeForSession error:', e);
          }
        }

        // Handle token_hash verification
        if (tokenHash && type === 'recovery') {
          try {
            const { error: otpErr } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery',
            });
            if (!otpErr) {
              if (isMounted) {
                setIsLinkInvalid(false);
                setLoading(false);
              }
              return;
            }
          } catch (e) {
            console.warn('[ResetPassword] verifyOtp error:', e);
          }
        }

        const hasRecoveryToken = 
          hash.includes('type=recovery') || 
          hash.includes('access_token=') || 
          Boolean(code) ||
          Boolean(tokenHash);

        if (!hasRecoveryToken) {
          if (isMounted) {
            setError('Invalid or expired password reset link. Please request a new one from the Login page.');
            setIsLinkInvalid(true);
            setLoading(false);
          }
        } else {
          // Allow Supabase client up to 2 seconds to exchange implicit hash for session
          setTimeout(async () => {
            if (!isMounted) return;
            const { data: { session: delayedSession } } = await supabase.auth.getSession();
            if (!delayedSession) {
              setError('Password reset link is invalid or has expired. Please request a new link.');
              setIsLinkInvalid(true);
            } else {
              setIsLinkInvalid(false);
              setError('');
            }
            setLoading(false);
          }, 1500);
        }
      } catch (err) {
        if (isMounted) {
          setError('Error checking session status. Please request a new link.');
          setIsLinkInvalid(true);
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message || 'Failed to reset password');
      } else {
        setSuccess('Password updated successfully! Redirecting to login...');
        
        // Sign out to invalidate the active recovery session
        await supabase.auth.signOut();
        
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-scanova-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-scanova-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-scanova-bg text-scanova-text transition-colors duration-200">
      {/* Top right theme switch */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeSelector compact={true} />
      </div>

      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 -top-40 -left-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }}
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 -bottom-32 -right-32 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06B6D4, transparent)' }}
        animate={{ scale: [1.1, 0.9, 1.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-neon mb-4">
            <ScanLine className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Scanova</h1>
          <p className="text-scanova-muted text-sm mt-1">Reset your password</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          {isLinkInvalid ? (
            <div className="space-y-4">
              <div className="glass rounded-xl p-6 border border-red-500/20 text-center">
                <p className="text-red-400 text-sm font-medium mb-4">{error}</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/auth')}
                  className="w-full py-3.5 rounded-xl gradient-primary text-white font-semibold text-sm shadow-neon"
                >
                  Go to Login
                </motion.button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-scanova-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl glass text-scanova-text placeholder-scanova-muted focus:outline-none focus:ring-2 focus:ring-scanova-purple/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-scanova-muted hover:text-scanova-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-scanova-muted" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl glass text-scanova-text placeholder-scanova-muted focus:outline-none focus:ring-2 focus:ring-scanova-purple/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-scanova-muted hover:text-scanova-text transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm text-center">
                  {error}
                </motion.p>
              )}

              {success && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-green-400 text-sm text-center">
                  {success}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={isUpdating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl gradient-primary text-white font-semibold text-base shadow-neon hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? 'Updating...' : 'Update Password'}
              </motion.button>
            </form>
          )}

          {!isLinkInvalid && (
            <div className="mt-6 glass rounded-xl p-4 text-center">
              <button
                onClick={() => navigate('/auth')}
                className="text-scanova-purple font-semibold text-sm hover:text-scanova-purple-light transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
