import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';

const AuthGuard = ({ children, fallback, requireAuth = true }) => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!requireAuth || isAuthenticated) {
    return children;
  }

  if (fallback) {
    return fallback(() => setShowAuthModal(true));
  }

  return (
    <>
      {children(() => setShowAuthModal(true))}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default AuthGuard;