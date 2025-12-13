import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { 
    user, 
    isAuthenticated, 
    loginWithRedirect, 
    logout: auth0Logout 
  } = useAuth0();

  const login = (options) => {
    loginWithRedirect(options);
  };

  const logout = () => {
    auth0Logout({ returnTo: window.location.origin });
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    // Keep mock email login for compatibility if needed, or remove
    loginWithEmail: (email) => {
      console.log("Mock login with", email);
      // This is a mock and won't be authenticated with Auth0
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
