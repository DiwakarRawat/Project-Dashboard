import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "./TeacherRegister.css";
import { useProjectData } from '../ProjectDataContext';

const TeacherRegister = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        designation: "", 
        employeeId: "",  
    });

    const { addAssignmentRequest } = useProjectData();

    // States for password visibility (fixes ESLint warnings when used below)
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const [error, setError] = useState("");
    const [submissionError, setSubmissionError] = useState("");

    // Live validation when typing
    useEffect(() => {
        if (
            formData.confirmPassword &&
            formData.password !== formData.confirmPassword
        ) {
            setError("Passwords do not match!");
        } else {
            setError("");
        }
    }, [formData.password, formData.confirmPassword]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => { 
        e.preventDefault();
        setSubmissionError(""); // Clear previous errors

        if (error) {
            alert("Please fix the password mismatch before submitting.");
            return;
        }

        // 1. Prepare data for the backend
        const dataToSend = {
            name: formData.fullName, // Backend expects 'name', not 'fullName'
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            designation: formData.designation,
            employeeId: formData.employeeId,
            role: 'teacher', // CRITICAL: Include the role
        };

        try {
            // 2. Send the request to the backend API
            const response = await axios.post(
                'http://localhost:5000/api/users/register', 
                dataToSend
            );

            // 3. Handle success
            console.log("Teacher Registered:", response.data);
            alert("Registration submitted successfully!");
            const assignedTeacherName = response.data.assignedTeacherName || 'Dr. Eleanor Evans';

            addAssignmentRequest(assignedTeacherName, formData.fullName);
            
            // Store user/token data and redirect
            localStorage.setItem("user", JSON.stringify(response.data));
            navigate("/StudentDashboard");

        } catch (err) {
            // 4. Handle errors (400 validation, 500 server, 11000 duplicate key)
            const errorData = err.response?.data;
            const errorMsg = errorData?.details || errorData?.message || "Registration failed. Please check the network.";
            console.error("Registration Failed:", err.response ? err.response.data : err.message);
            setSubmissionError(errorMsg);
        }
    };

    return (
        <div className="teacher-register-wrapper">
            <form className="teacher-register-form" onSubmit={handleSubmit}>
                <h1>TEACHER REGISTRATION</h1>
                
                {submissionError && <p className="error-text submission-error">{submissionError}</p>}

                <div className="input-box">
                    <label>Full Name:</label>
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Fullname"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-box">
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email ID"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-box password-field">
                    <label>Set Password:</label>
                    <input
                        // 🚨 FIX 2: Use state to toggle password type (removes ESLint warnings)
                        type={showPassword ? "text" : "password"} 
                        name="password"
                        placeholder="Password"
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

                <div className="input-box password-field">
                    <label>Confirm Password:</label>
                    <input
                        // 🚨 FIX 3: Use state to toggle password type (removes ESLint warnings)
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    <span
                        className="toggle-password"
                        onClick={() => setShowConfirm(!showConfirm)}
                    >
                        {showConfirm ? "Hide" : "Show"}
                    </span>
                </div>

                {error && <p className="error-text">{error}</p>}

                <div className="input-box">
                    <label>Contact:</label>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Input for Designation */}
                <div className="input-box">
                    <label>Designation:</label>
                    <input
                        type="text"
                        name="designation"
                        placeholder="Designation"
                        value={formData.designation}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Input for Employee ID */}
                <div className="input-box">
                    <label>Employee ID:</label>
                    <input
                        type="text"
                        name="employeeId"
                        placeholder="Employee Id"
                        value={formData.employeeId}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button className="btn" type="submit" disabled={!!error}>
                    SUBMIT
                </button>
            </form>
        </div>
    );
};

export default TeacherRegister;