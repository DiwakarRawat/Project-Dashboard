import React from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import "./Register.css";

const Register = () => {
  const navigate = useNavigate(); // ✅ Initialize navigate

  return (
    <div className="register-page">
      {/* Animated Background Blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>

      <div className="register-container">
        <h1 className="register-title">REGISTER AS</h1>
        <div className="button-group">
          {/* ✅ Use navigate for SPA routing */}
          <button
            className="register-btn"
            onClick={() => navigate("/StudentRegister")}
          >
            Student
          </button>
          <button
            className="register-btn"
            onClick={() => navigate("/TeacherRegister")}
          >
            Teacher
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;