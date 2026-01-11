import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await resetPassword(email);
            if (error) throw error;
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="login-container">
                <div className="login-card success-card">
                    <div className="success-icon">
                        <CheckCircle2 size={64} color="var(--success)" />
                    </div>
                    <h1>Check your email</h1>
                    <p className="subtitle">
                        We've sent a password reset link to <strong>{email}</strong>
                    </p>
                    <div className="login-footer">
                        <Link to="/login" className="back-to-login">
                            <ArrowLeft size={16} />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-box">
                        <GraduationCap size={48} color="white" />
                    </div>
                    <h1>Reset Password</h1>
                    <p className="subtitle">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <Mail className="input-icon" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={20} /> : 'Send Reset Link'}
                    </button>
                </form>

                <div className="login-footer">
                    <Link to="/login" className="back-to-login">
                        <ArrowLeft size={16} />
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
