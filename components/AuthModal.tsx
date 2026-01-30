
import React, { useState, useEffect } from 'react';
import { getSiteUrl } from '../lib/config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'signin' | 'signup';
  onLoginSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode, onLoginSuccess }) => {
  // const [mode, setMode] = useState(initialMode); // Unused
  const [error, setError] = useState<string | null>(null);

  // Reset error when modal opens
  useEffect(() => {
    setError(null);
  }, [isOpen]);



  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const { supabase } = await import('../lib/supabaseClient');
      // Using hardcoded URL as per user request to ensure production redirect works
      const redirectTo = "https://1st-startup.vercel.app/auth/callback";
      console.log('[Auth] Signing in with Google, redirecting to:', redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleLinkedInLogin = async () => {
    try {
      setError(null);
      const { supabase } = await import('../lib/supabaseClient');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${getSiteUrl()}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-navy-900 transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
        >
          <i className="fas fa-times text-lg"></i>
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-bold text-navy-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-600 text-sm">
              Connect with your preferred social account.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start text-left animate-shake">
              <i className="fas fa-exclamation-circle text-red-500 mt-0.5 mr-3 flex-shrink-0"></i>
              <div className="text-sm text-red-600">
                <p className="font-bold mb-1">Authentication Failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Social Auth */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 bg-white"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-2" alt="Google" />
              Google
            </button>
            <button
              type="button"
              onClick={handleLinkedInLogin}
              className="flex items-center justify-center px-4 py-2.5 bg-[#0077b5] hover:bg-[#004182] text-white rounded-lg transition-colors text-sm font-medium"
            >
              <i className="fab fa-linkedin text-lg mr-2"></i>
              LinkedIn
            </button>
          </div>


        </div>

        {/* Footer */}

      </div>
    </div>
  );
};

export default AuthModal;
