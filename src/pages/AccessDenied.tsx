import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-scanova-bg text-scanova-text flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden text-center transition-colors duration-200">
      {/* Background glow elements */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-10 top-1/4 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #EF4444, transparent)' }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="relative z-10 max-w-md w-full glass rounded-3xl p-8 border border-red-500/30 shadow-2xl backdrop-blur-2xl"
      >
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
          <ShieldAlert className="w-10 h-10 text-red-400" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-3">
          <Lock className="w-3.5 h-3.5" /> 403 Forbidden Access
        </div>

        <h1 className="text-2xl font-bold text-scanova-text mb-2">Administrator Access Required</h1>
        <p className="text-scanova-muted text-sm mb-6 leading-relaxed">
          The page or analytical resource you are trying to access is restricted exclusively to authorized Scanova Administrator accounts.
        </p>

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/home')}
            className="w-full py-3.5 rounded-xl gradient-primary text-white font-semibold flex items-center justify-center gap-2 shadow-neon transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Customer Store
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
