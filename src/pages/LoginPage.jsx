// src/pages/LoginPage.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton'; // Assuming you have a wrapper for styling
import { AuthContext } from '../App';

const LoginPage = () => {
    const { isAuthenticated } = useContext(AuthContext);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <GoogleLoginButton />
    );
};

export default LoginPage;
