import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import '../../styles/Settings.css';

const ChangePasswordForm = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const passwordRequirements = [
        { label: 'Al menos 8 caracteres', test: (pwd) => pwd.length >= 8 },
        { label: 'Una letra mayúscula', test: (pwd) => /[A-Z]/.test(pwd) },
        { label: 'Una letra minúscula', test: (pwd) => /[a-z]/.test(pwd) },
        { label: 'Un número', test: (pwd) => /[0-9]/.test(pwd) },
        { label: 'Un carácter especial', test: (pwd) => /[!@#$%^&*]/.test(pwd) }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(null);
        setSuccess(false);
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
        setSuccess(false);

        if (!validatePassword()) {
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.newPassword
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            console.error('Error updating password:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-form">
            <div className="form-header">
                <Lock size={24} />
                <h3>Cambiar Contraseña</h3>
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
                    Contraseña actualizada exitosamente
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nueva Contraseña</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showPasswords.new ? 'text' : 'password'}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => togglePasswordVisibility('new')}
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
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => togglePasswordVisibility('confirm')}
                        >
                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
            </form>
        </div>
    );
};

export default ChangePasswordForm;
