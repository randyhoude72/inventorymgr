// App.js 
import React, { useContext, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Import your components/pages
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import InventoryTablePage from './pages/InventoryTablePage';
import NotFoundPage from './pages/NotFoundPage';
import Navbar from './components/Navbar'; 

// --- Context for Global State Management ---
export const AuthContext = React.createContext();
const USER_PROFILE_STORAGE_KEY = 'userProfile';

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [userProfile, setUserProfile] = useState(() => {
    const storedProfile = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    return storedProfile ? JSON.parse(storedProfile) : null;
  });

  const value = useMemo(() => ({
    isAuthenticated: !!token,
    token,
    userProfile,
    login: (newToken) => {
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
    },
    setUserProfile: (profile) => {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      setUserProfile(profile);
    },
    logout: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
      setToken(null);
      setUserProfile(null);
    },
  }), [token, userProfile]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}


// --- Protected Route Component (The Gatekeeper) ---
const ProtectedRoute = ({ element }) => {
    const { isAuthenticated } = useContext(AuthContext);

    // If not authenticated, redirect them to the login page
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Otherwise, render the intended element
    return element; 
};


function App() {
  return (
    <AuthProvider>
      {/* Use BrowserRouter to enable routing */}
      <BrowserRouter>
        <Navbar /> {/* Navbar is visible on all pages */}
        <Routes>
          {/* Public Route: Accessible by anyone */}
          <Route path="/login" element={<LoginPage />} /> 

          {/* One page per entry in orgInfo.inventory */}
          <Route
            path="/inventory/:inventoryName"
            element={<ProtectedRoute element={<InventoryTablePage />} />}
          />

          {/* Default/Home Route */}
          <Route path="/" element={<LandingPage />} />

          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
