import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// 1. Create the Context object
const AuthContext = createContext();

// 2. Custom hook for easy access to the context values
export const useAuth = () => useContext(AuthContext);

// 3. The Provider Component that manages state and exposes functions
export const AuthProvider = ({ children }) => {

    // Attempt to load initial state from local storage on component mount
    const initialLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    // Using 'user' key for consistency across the app
    const initialUser = JSON.parse(localStorage.getItem('user')) || null;

    const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
    const [userProfile, setUserProfile] = useState(initialUser);


    // Effect to persist the login state and user profile to Local Storage
    useEffect(() => {
        localStorage.setItem('isLoggedIn', isLoggedIn);
        if (userProfile) {
            // CRITICAL: Ensure we always save the profile under the key 'user'
            localStorage.setItem('user', JSON.stringify(userProfile));
        } else {
            localStorage.removeItem('user');
        }
    }, [isLoggedIn, userProfile]);

    // --- REGISTER FUNCTION (AXIOS) ---
    const register = async (data) => {
        try {
            const response = await axios.post(
                'http://localhost:5000/api/users/register',
                data
            );

            const user = response.data;

            setUserProfile(user);
            setIsLoggedIn(true);
            localStorage.setItem("user", JSON.stringify(user));

            // FIXED: Ensure userRole is retrieved from the user object returned by the backend
            return { success: true, user: user, userRole: user.role };

        } catch (err) {
            const errorData = err.response?.data;
            const errorMsg = errorData?.details || errorData?.message || "Registration failed.";

            return { success: false, message: errorMsg };
        }
    };

    // --- LOGIN FUNCTION (AXIOS) ---
    const login = async (email, password) => {
        try {
            const response = await axios.post(
                'http://localhost:5000/api/users/login',
                { email, password }
            );

            const user = response.data;

            setUserProfile(user);
            setIsLoggedIn(true);
            localStorage.setItem("user", JSON.stringify(user));

            // FIXED: Ensure userRole is retrieved from the user object returned by the backend
            return { success: true, user: user, userRole: user.role };

        } catch (err) {
            console.error("Login Error:", err);
            let errorMsg = "Login failed. Check your credentials.";

            if (err.response) {
                // Server responded with a status code outside 2xx
                const errorData = err.response.data;
                errorMsg = errorData?.details || errorData?.message || errorMsg;
            } else if (err.request) {
                // Request was made but no response received
                errorMsg = "Network Error: Server unreachable. Please check your connection.";
            } else {
                // Something happened in setting up the request
                errorMsg = "Error: " + err.message;
            }

            return { success: false, message: errorMsg };
        }
    };

    // --- LOGOUT FUNCTION ---
    const logout = () => {
        setIsLoggedIn(false);
        setUserProfile(null);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
    };

    const contextValue = {
        isLoggedIn,
        userProfile,
        login,
        logout,
        register,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};