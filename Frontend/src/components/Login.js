import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // <--- ADDED useNavigate hook
import { useAuth } from "../AuthContext"; // <--- ADDED useAuth hook
import "./Login.css";

const Login = () => {
    // Hooks and Context
    const navigate = useNavigate();
    const { login } = useAuth();
    
    // State for form data (required to submit email/password)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState(""); // For displaying API errors

    // Handler to update form data
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError(""); // Clear previous errors

        const { email, password } = formData;
        
        try {
            // 1. Call the centralized login function from AuthContext.
            const result = await login(email, password); 

            if (result.success) {
                // 2. Read the user role from the result object returned by AuthContext
                // We default to 'student' if the role is somehow missing.
                const userRole = result.user?.role || 'student'; 

                // 3. Redirect based on role
                if (userRole === 'teacher') {
                    navigate("/teacherdashboard");
                } else {
                    navigate("/studentdashboard"); 
                }
            } else {
                // Handle login failure
                setLoginError(result.message || "Login failed. Check your credentials."); 
            }
        } catch (err) {
            // Catches network/unexpected errors
            console.error("Login attempt failed:", err);
            setLoginError("An unexpected error occurred. Please try again later.");
        }
    };

    return (
        <div className="login-container">
            <form className="login-card" onSubmit={handleSubmit}>
                <h1>LOGIN</h1>
                
                {/* Display Login Error */}
                {loginError && <p className="error-text">{loginError}</p>}

                {/* User ID */}
                <div className="input-box">
                    <input 
                        type="text" 
                        placeholder="User ID" 
                        name="email" // <--- ADDED: Name for handling in state
                        value={formData.email}
                        onChange={handleChange}
                        required 
                    />
                </div>

                {/* Password */}
                <div className="input-box">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        name="password" // <--- ADDED: Name for handling in state
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <span
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </span>
                </div>

                {/* Options */}
                <div className="login-options">
                    <label>
                        <input type="checkbox" /> Remember me
                    </label>
                    <Link to="/forgotpassword">Forgot password?</Link>
                </div>

                {/* Button */}
                <button className="login-btn" type="submit">
                    LOGIN
                </button>

                {/* Register */}
                <div className="register-link">
                    {/* Changed <a> to <Link> for React Router consistency */}
                    Don't have an account? <Link to="/register">Register Now</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;