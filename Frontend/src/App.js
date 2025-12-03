import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth, AuthProvider } from "./AuthContext";
import Navbar from "./components/navbar";
import Homepage from "./components/Homepage";
import Register from "./components/Register";
import Login from "./components/Login";
import StudentRegister from "./components/StudentRegister";
import TeacherRegister from "./components/TeacherRegister";
import ForgotPassword from "./components/ForgotPassword";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import { ProjectDataProvider } from './ProjectDataContext';

/**
 * ProtectedRoute Component
 * This component checks the user's login status from AuthContext.
 * If logged in, it renders the child element (Dashboard).
 * If logged out, it redirects to the login page.
 */
const ProtectedRoute = ({ element }) => {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        // Redirect to the login page, retaining the current location to redirect back after login
        return <Navigate to="/login" replace />;
    }

    return element;
};


const AppContent = () => {
    // useLocation() is now correctly wrapped by the Router in the App component.
    const location = useLocation();
    const isDashboard = location.pathname === '/studentdashboard' || location.pathname === '/teacherdashboard';

    return (
        <>
            {!isDashboard && <Navbar />}

            <Routes>
                {/* Core Pages */}
                <Route path="/" element={<Homepage />} />
                <Route path="/homepage" element={<Homepage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Registration Forms */}
                <Route path="/studentregister" element={<StudentRegister />} />
                <Route path="/teacherregister" element={<TeacherRegister />} />
                <Route path="/forgotpassword" element={<ForgotPassword />} />

                {/* --- DASHBOARD ROUTES (Protected) --- */}
                <Route
                    path="/studentdashboard"
                    element={<ProtectedRoute element={<StudentDashboard />} />}
                />
                <Route
                    path="/teacherdashboard"
                    element={<ProtectedRoute element={<TeacherDashboard />} />}
                />
            </Routes>
        </>
    );
};


function App() {
    return (
        <Router>
            <AuthProvider>
                <ProjectDataProvider>
                    <AppContent />
                </ProjectDataProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;