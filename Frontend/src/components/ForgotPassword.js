import React, { useState } from "react";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }

    // Simulate sending reset instructions
    console.log("Password reset link sent to:", email);
    setMessage("✅ Password reset link has been sent to your email.");
    setEmail("");
  };

  return (
    <div className="reset-wrapper">
      <form className="reset-form" onSubmit={handleSubmit}>
        <h1>Reset Password</h1>
        <p className="reset-info">
          Enter your registered email address and we'll send you instructions to reset your password.
        </p>

        <div className="input-box">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage("");
            }}
            required
          />
        </div>

        {message && <p className="reset-message">{message}</p>}

        <button className="btn" type="submit">
          Send Reset Link
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;