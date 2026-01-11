import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import '../styles/ResetPassword.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false
    });

    const passwordRequirements = [
        { label: 'Al menos 8 caracteres', test: (pwd) => pwd.length >= 8 },
        { label: 'Una letra mayúscula', test: (pwd) => /[A-Z]/.test(pwd) },
        { label: 'Una letra minúscula', test: (pwd) => /[a-z]/.test(pwd) },
        { label: 'Un número', test: (pwd) => /[0-9]/.test(pwd) },
        { label: 'Un carácter especial', test: (pwd) => /[!@#$%^&*]/.test(pwd) }
    ];

    useEffect(() => {
        // Suppabase handles the recovery session automatically from the URL hash.
        // We just need to wait and confirm it's there.
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            // Look for token in URL as a backup/manual check
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const type = hashParams.get('type');

            if (!session && !accessToken) {
                setError('La sesión de recuperación ha expirado o el enlace es inválido. Por favor, solicita un nuevo correo.');
            } else if (type !== 'recovery' && !session) {
                // If it's another type of link, it might not be a password reset
                console.warn('Link type is not recovery:', type);
            }
        };

        checkSession();

        // Listen for auth state changes to catch when Supabase sets the session
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                console.log('Password recovery mode active');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(null);
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords({
            ...showPasswords,
            [field]: !showPasswords[field]
        });
    };

    const validatePassword = () => {
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }

        const allRequirementsMet = passwordRequirements.every(req => req.test(formData.newPassword));
        if (!allRequirementsMet) {
            setError('La contraseña no cumple con todos los requisitos');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!validatePassword()) {
            setLoading(false);
            return;
        }

        try {
            // Re-verify session before updating
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError('No se pudo establecer una sesión segura. El enlace podría haber expirado o ya fue utilizado. Por favor, solicita uno nuevo.');
                setLoading(false);
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.newPassword
            });

            if (updateError) throw updateError;

            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Error updating password:', err);
            let userFriendlyMessage = err.message;
            if (err.message === 'Auth session missing!') {
                userFriendlyMessage = 'Sesión no encontrada. Es probable que el enlace haya expirado. Intenta solicitar uno nuevo.';
            }
            setError(userFriendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="reset-header">
                    <div className="icon-box">
                        <Lock size={32} />
                    </div>
                    <h1>Establecer Nueva Contraseña</h1>
                    <p>Crea una contraseña segura para tu cuenta</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <X size={18} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <Check size={18} />
                        ¡Contraseña actualizada! Redirigiendo al inicio de sesión...
                    </div>
                )}

                <form onSubmit={handleSubmit} className="reset-form">
                    <div className="form-group">
                        <label>Nueva Contraseña</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                disabled={success}
                                placeholder="Ingresa tu nueva contraseña"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => togglePasswordVisibility('new')}
                                disabled={success}
                            >
                                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="password-requirements">
                        <p className="requirements-title">Requisitos de contraseña:</p>
                        <ul>
                            {passwordRequirements.map((req, index) => (
                                <li key={index} className={req.test(formData.newPassword) ? 'met' : ''}>
                                    {req.test(formData.newPassword) ? <Check size={14} /> : <X size={14} />}
                                    {req.label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="form-group">
                        <label>Confirmar Nueva Contraseña</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                disabled={success}
                                placeholder="Confirma tu nueva contraseña"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => togglePasswordVisibility('confirm')}
                                disabled={success}
                            >
                                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary btn-full" disabled={loading || success}>
                        {loading ? (
                            <>
                                <Loader2 className="spinner" size={18} />
                                Actualizando...
                            </>
                        ) : success ? (
                            'Contraseña Actualizada'
                        ) : (
                            'Establecer Contraseña'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
