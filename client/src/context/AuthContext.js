import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('authToken');
    return token ? { token } : null;
  });


  useEffect(() => {
    if (auth) {
      localStorage.setItem('authToken', auth.token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [auth]);

  const login = (token) => {
    sessionStorage.setItem('authToken',token)
    setAuth({ token });
  };

  const logout = () => {
    sessionStorage.removeItem('authToken'); 
    localStorage.removeItem('authToken');
    setAuth(null); 
    console.log("🚪 Logged out: Token removed.");
    window.location.reload(); 
};


  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
