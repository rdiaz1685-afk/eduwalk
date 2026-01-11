import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { roles } from '../../data/team';

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'Coordinador',
        school: '',
        status: 'Active'
    });
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchSchools();
        }
    }, [isOpen]);

    // Handle role changes to set default school
    useEffect(() => {
        const roleMapping = {
            'Coordinador': 'coordinator',
            'Supervisor': 'supervisor',
            'Director de Campus': 'director',
            'Rector': 'rector',
            'Administrador': 'admin'
        };
        const dbRole = roleMapping[formData.role];
        const isUniversal = ['rector', 'supervisor', 'admin'].includes(dbRole);

        if (isUniversal && formData.school !== 'Todos') {
            setFormData(prev => ({ ...prev, school: 'Todos' }));
        } else if (!isUniversal && formData.school === 'Todos') {
            setFormData(prev => ({ ...prev, school: '' }));
        }
    }, [formData.role]);

    const fetchSchools = async () => {
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('*');
            if (error) throw error;
            setSchools(data || []);
        } catch (err) {
            console.error('Error fetching schools:', err);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { email, school, status, role, firstName, lastName } = formData;
            const full_name = `${firstName.trim()} ${lastName.trim()}`;

            // Generate a random password (user will reset it via email)
            const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + 'Aa1!';

            // Step 1: Create auth user (auto-confirmed)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: tempPassword,
                options: {
                    data: {
                        full_name: full_name,
                        role: role
                    },
                    // No emailRedirectTo here, as we'll send a password reset email
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create user');

            // Step 2: Map Spanish roles to DB enum values
            const roleMapping = {
                'Coordinador': 'coordinator',
                'Supervisor': 'supervisor',
                'Director de Campus': 'director',
                'Rector': 'rector',
                'Administrador': 'admin'
            };

            const dbRole = roleMapping[role] || role.toLowerCase();
            const isUniversalRole = ['rector', 'supervisor', 'admin'].includes(dbRole);

            // Step 3: Find school_id
            let schoolId = null;
            if (!isUniversalRole && school && school !== 'Todos') {
                const selectedSchool = schools.find(s => s.name === school);
                schoolId = selectedSchool ? selectedSchool.id : null;
            }

            // Step 4: Update the profile with additional data
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: full_name,
                    role: dbRole,
                    school_id: schoolId
                })
                .eq('id', authData.user.id)
                .select()
                .single();

            if (profileError) throw profileError;

            // Step 5: Send password reset email
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (resetError) {
                console.error('Error sending reset email:', resetError);
                // Don't throw - user was created successfully
                alert(`⚠️ Usuario creado, pero hubo un problema al enviar el email.\n\nPuedes enviar manualmente un enlace de recuperación de contraseña a: ${email}`);
            } else {
                // Success - email sent
                alert(`✅ Usuario creado exitosamente!\n\nSe ha enviado un correo electrónico a ${email} con un enlace para establecer su contraseña.\n\nEl enlace expirará en 1 hora.`);
            }

            onUserAdded(profileData);
            onClose();
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                role: 'Coordinador',
                school: '',
                status: 'Active'
            });
        } catch (err) {
            console.error('Error adding user:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" style={{
                background: 'var(--bg-card)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: '500px',
                border: '1px solid var(--bg-main)'
            }}>
                <div className="flex justify-between items-center mb-4" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ margin: 0 }}>Add New User</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Nombre(s)</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Juan Pablo"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--bg-main)',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-main)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Apellidos</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Pérez Gómez"
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--bg-main)',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-main)'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bg-main)',
                                background: 'var(--bg-main)',
                                color: 'var(--text-main)'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bg-main)',
                                background: 'var(--bg-main)',
                                color: 'var(--text-main)'
                            }}
                        >
                            {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    {(() => {
                        const roleMapping = {
                            'Coordinador': 'coordinator',
                            'Supervisor': 'supervisor',
                            'Director de Campus': 'director',
                            'Rector': 'rector',
                            'Administrador': 'admin'
                        };
                        const dbRole = roleMapping[formData.role];
                        const isUniversal = ['rector', 'supervisor', 'admin'].includes(dbRole);

                        if (isUniversal) return null;

                        return (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>School / Campus</label>
                                <select
                                    name="school"
                                    value={formData.school}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--bg-main)',
                                        background: 'var(--bg-main)',
                                        color: 'var(--text-main)'
                                    }}
                                >
                                    <option value="">Select Campus</option>
                                    {Array.isArray(schools) && schools.map(school => (
                                        <option key={school.id} value={school.name}>{school.name}</option>
                                    ))}
                                </select>
                            </div>
                        );
                    })()}

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'transparent',
                                border: '1px solid var(--bg-main)',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
