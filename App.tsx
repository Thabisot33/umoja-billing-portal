import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Admin } from './types';

const App: React.FC = () => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const local = localStorage.getItem("loggedInAdmin");
    const session = sessionStorage.getItem("loggedInAdmin");

    if (local) {
      setAdmin(JSON.parse(local));
    } else if (session) {
      setAdmin(JSON.parse(session));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (adminData: Admin, remember: boolean) => {
    setAdmin(adminData);
    if (remember) {
      localStorage.setItem("loggedInAdmin", JSON.stringify(adminData));
      sessionStorage.removeItem("loggedInAdmin");
    } else {
      sessionStorage.setItem("loggedInAdmin", JSON.stringify(adminData));
      localStorage.removeItem("loggedInAdmin");
    }
  };

  const handleLogout = () => {
    setAdmin(null);
    localStorage.removeItem("loggedInAdmin");
    sessionStorage.removeItem("loggedInAdmin");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50 text-brand-500 font-bold">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f6f8fa] font-sans text-slate-800">
      {admin ? (
        <Dashboard admin={admin} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;