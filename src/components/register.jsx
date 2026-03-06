import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './register-css.css';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import PasswordIcon from '@mui/icons-material/Password';
import Checkbox from '@mui/material/Checkbox';


export default function RegisterPage() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (confirm && confirm !== password) {
      setError("Passwords do not match");
      return;
    }

    if (!fullname || !email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email, phone, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Save user info to localStorage
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userName", data.fullname);
        // Navigate to homepage
        navigate("/homepage");
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Server error. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>

        <h2>Create Account</h2>
        {error && <p className="error-message">{error}</p>}
        <PersonIcon />

        <div className="input-group">
          <label>Full name</label>
          <input
            type="text"
            placeholder="Your full name"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <EmailIcon />
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <ContactPhoneIcon />
          <label>Phone</label>
          <input
            type="tel"
            placeholder="+91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <PasswordIcon />
          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <PasswordIcon />
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
        <p className="form-meta">By creating an account you agree to our terms.</p>
        <Checkbox></Checkbox>
        <label className="checkbox-label">I agree to the terms and conditions</label>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in here</Link></p>
      </form>
    </div>
  );
}