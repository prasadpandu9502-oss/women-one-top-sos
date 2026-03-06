import React, { useState } from "react";
import './signup.css';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Email from '@mui/icons-material/Email';
import Password from '@mui/icons-material/Password';
import LockIcon from '@mui/icons-material/Lock'


const SignupForm = () => {

    return (
        <div className="signup-form-container">
            <form style={{ maxWidth: "400px", margin: "auto" }} action="/user/register" method="post">
                <h2><LockIcon /> Signup</h2>

                <div>
                    <label>
                        <PersonAdd />
                        Username:
                    </label>
                    <input
                    type="text"
                    name="username"
                    required
                    />
                </div>

                <div>
                    <label>
                        <Email />
                        Email:
                    </label>
                    <input
                    type="email"
                    name="email"
                    required
                    />
                </div>

                <div>
                    <label>
                        <Password />
                        Password:
                    </label>
                    <input
                        type="password"
                        name="password"
                        pattern="[A-Za-z]{4,10}[~!@#$%^&*?]{1,3}[0-9]{1,5}"
                    />
                </div>

                <div className="signup">
                    <button type="submit"
                    >Sign Up</button>
                </div>
            </form>
        </div>
    );
};

export default SignupForm;