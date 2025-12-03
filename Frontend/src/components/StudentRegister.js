import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentRegister.css";
import axios from 'axios'; 

const StudentRegister = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        studentClass: "",
        rollNumber: "",
        phone: "",
        projectTitle: "",
        mentorName: "",
    });

    const [members, setMembers] = useState([]);
    const [showMembers, setShowMembers] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // State for displaying specific backend errors (Duplicate key, etc.)
    const [submissionError, setSubmissionError] = useState(""); 
    const [error, setError] = useState("");

    useEffect(() => {
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
        } else {
            setError("");
        }
    }, [formData.password, formData.confirmPassword]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // This line allows all fields (including projectTitle, mentorName) to update
        setFormData({ ...formData, [name]: value }); 
    };

    const handleMemberChange = (index, e) => {
        const { name, value } = e.target;
        const updatedMembers = [...members];
        updatedMembers[index][name] = value;
        setMembers(updatedMembers);
    };

    const addFirstMember = () => {
        setShowMembers(true);
        if (members.length === 0) {
            setMembers([{ memberName: "", memberEmail: "", memberRoll: "", memberClass: "", memberPhone: "" }]);
        }
    };

    const addMoreMembers = () => {
        setMembers([
            ...members,
            { memberName: "", memberEmail: "", memberRoll: "", memberClass: "", memberPhone: "" },
        ]);
    };

    const handleSubmit = async (e) => { 
        e.preventDefault();
        setSubmissionError(""); 

        if (error) {
            alert("Please fix the password mismatch before submitting.");
            return;
        }

        // 1. Prepare data for the backend
        const dataToSend = {
            name: formData.name, 
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            rollNumber: formData.rollNumber,
            class: formData.studentClass,
            projectTitle: formData.projectTitle, 
            mentorName: formData.mentorName, 
            members: members,
            role: 'student', 
        };

        try {
            // 2. Send the request to the combined backend endpoint
            const response = await axios.post(
                'http://localhost:5000/api/projects/submit-registration', 
                dataToSend
            );

            // 3. Handle successful response
            console.log("Registration Success:", response.data);
            alert("Registration and Project submitted successfully!");

            // Store user/token data and redirect
            localStorage.setItem("user", JSON.stringify(response.data));
            navigate("/studentdashboard");

        } catch (err) {
            // 4. Handle error from the backend (400 Validation, Duplicate Key)
            const errorData = err.response?.data;
            
            //  Get specific error details from backend
            const specificError = errorData?.details || errorData?.message || "Registration failed. Check network console for details.";
            
            console.error("Registration Failed (Backend Response):", errorData);
            setSubmissionError(specificError); // Display the specific error message
            
            alert(specificError); // Alert the user with the specific error
        }
    };

    return (
        <div className="student-register-wrapper">
            <form className="student-register-form" onSubmit={handleSubmit}>
                <h1>STUDENT REGISTRATION</h1>

                {/* 🚨 DISPLAY SUBMISSION ERROR */}
                {submissionError && <p className="error-text submission-error">{submissionError}</p>}
                
                {/* Full Name */}
                <div className="input-box">
                    <label>Full Name:</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="Fullname"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Email */}
                <div className="input-box">
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Id"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Set Password */}
                <div className="input-box password-field">
                    <label>Set Password:</label>
                    <input
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

                {/* Confirm Password */}
                <div className="input-box password-field">
                    <label>Confirm Password:</label>
                    <input
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

                {/* Password Mismatch Error */}
                {error && <p className="error-text">{error}</p>}

                {/* Class */}
                <div className="input-box">
                    <label>Class:</label>
                    <input
                        type="text"
                        name="studentClass"
                        placeholder="Eg.: 3CS(A)"
                        value={formData.studentClass}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Roll Number */}
                <div className="input-box">
                    <label>Roll Number:</label>
                    <input
                        type="text"
                        name="rollNumber"
                        placeholder="Eg.: 1/22/FET/BCS/123"
                        value={formData.rollNumber}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Contact/Phone */}
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

                {/* Project Title */}
                <div className="input-box">
                    <label>Project Title:</label>
                    <input
                        type="text"
                        name="projectTitle"
                        placeholder="Title"
                        value={formData.projectTitle} // ⬅️ FIXED value binding
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Mentor Name */}
                <div className="input-box">
                    <label>Mentor Name:</label>
                    <input
                        type="text"
                        name="mentorName"
                        placeholder="Mentor"
                        value={formData.mentorName} // ⬅️ FIXED value binding
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Add Members Section */}
                {!showMembers && (
                    <button type="button" className="btn add-btn" onClick={addFirstMember}>
                        Add Group Members
                    </button>
                )}

                {showMembers && (
                    <div className="members-section">
                        <h2>Group Members</h2>

                        {members.map((member, index) => (
                            <div key={index} className="member-box">
                                <h3>Member {index + 1}</h3>

                                <div className="input-box">
                                    <label>Full Name:</label>
                                    <input
                                        type="text"
                                        name="memberName"
                                        placeholder="Full Name"
                                        value={member.memberName}
                                        onChange={(e) => handleMemberChange(index, e)}
                                        required
                                    />
                                </div>

                                <div className="input-box">
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        name="memberEmail"
                                        placeholder="Email Id"
                                        value={member.memberEmail}
                                        onChange={(e) => handleMemberChange(index, e)}
                                        required
                                    />
                                </div>

                                <div className="input-box">
                                    <label>Class:</label>
                                    <input
                                        type="text"
                                        name="memberClass"
                                        placeholder="Eg.: 3CS(B)"
                                        value={member.memberClass}
                                        onChange={(e) => handleMemberChange(index, e)}
                                        required
                                    />
                                </div>

                                <div className="input-box">
                                    <label>Roll Number:</label>
                                    <input
                                        type="text"
                                        name="memberRoll"
                                        placeholder="Eg.: 1/22/FET/BCS/456"
                                        value={member.memberRoll}
                                        onChange={(e) => handleMemberChange(index, e)}
                                        required
                                    />
                                </div>

                                <div className="input-box">
                                    <label>Contact:</label>
                                    <input
                                        type="tel"
                                        name="memberPhone"
                                        placeholder="Phone Number"
                                        value={member.memberPhone}
                                        onChange={(e) => handleMemberChange(index, e)}
                                        required
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Add more members button */}
                        <button
                            type="button"
                            className="btn add-more-btn"
                            onClick={addMoreMembers}
                        >
                            Add More Members
                        </button>
                    </div>
                )}

                {/* Submit */}
                <button className="btn" type="submit" disabled={!!error}>
                    SUBMIT
                </button>
            </form>
        </div>
    );
};

export default StudentRegister;