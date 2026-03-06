import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './login-css.css';
import EmailIcon from '@mui/icons-material/Email';
import PasswordIcon from '@mui/icons-material/Password';


const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please enter email and password");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/user/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Save user info to localStorage
                localStorage.setItem("userEmail", data.email);
                localStorage.setItem("userName", data.fullname);
                // Navigate to homepage
                navigate("/homepage");
            } else {
                setError(data.error || "Login failed. Please try again.");
            }
        } catch (err) {
            setError("Server error. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2 className="heading">Welcome Back</h2>

                {error && <p className="error-message" style={{ color: '#ff4d6d', marginBottom: '10px' }}>{error}</p>}

                <div className="input-group">
                    <EmailIcon />
                    <label htmlFor="Email">Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <PasswordIcon />
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? "Logging in..." : "Submit"}
                </button>
                <p className="register-link">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;