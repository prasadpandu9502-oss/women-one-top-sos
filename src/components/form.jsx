import React, { useState } from "react";
import "./form.css";
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockIcon from '@mui/icons-material/Lock';
import Email from '@mui/icons-material/Mail'

const LoginForm = () => {

    return (
        <div className="login-container">
            <form className="login-form" action="/user/login" method="post">
                <h2 className="form-title">
                    <LockIcon className="lockicon"/>
                    Login
                </h2>

                <div className="input-group">
                    <label htmlFor="email" className="input-label">
                        <Email className="labelicon"/>
                        Email
                    </label>
                    <input
                        type="text"
                        id="email"
                        name="email"
                        required
                    />
                </div>


                <div className="input-group">
                    <label htmlFor="password" className="input-label">
                        <VpnKeyIcon className="labelicon"/>
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                    />
                </div>

                <div className="submit-btn">
                        <button type="submit">
                        Submit
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;