import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Loader2, Lock, Mail } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-box">
                        <GraduationCap size={48} color="white" />
                    </div>
                    <h1>Welcome Back</h1>
                    <p className="subtitle">Sign in to Education Walkthrough</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <Mail className="input-icon" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => {
                                if (email.trim() && !email.includes('@')) {
                                    setEmail(email.trim() + '@cambridgemty.edu.mx');
                                }
                            }}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <Lock className="input-icon" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={20} /> : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <Link to="/forgot-password">Forgot password?</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
