import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { roles } from '../../data/team';

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        role: '',
        school_id: '',
    });
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                full_name: user.full_name || '',
                role: user.role || 'coordinator',
                school_id: user.school_id || '',
            });
            fetchSchools();
        }
    }, [isOpen, user]);

    const fetchSchools = async () => {
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .order('name');
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
            const { full_name, role, school_id } = formData;

            // Validate Logic
            const isUniversalRole = ['rector', 'supervisor', 'admin'].includes(role);
            const finalSchoolId = isUniversalRole ? null : (school_id || null);

            const { data, error } = await supabase
                .from('profiles')
                .update({
                    full_name,
                    role,
                    school_id: finalSchoolId
                })
                .eq('id', user.id)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error("No se pudo actualizar el usuario. Es posible que no tengas permisos para esta acción.");
            }

            onUserUpdated(data[0]);
            onClose();
        } catch (err) {
            console.error('Error updating user:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to determine if school selection should be shown
    const shouldShowSchool = !['rector', 'supervisor', 'admin'].includes(formData.role);

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
                    <h2 style={{ margin: 0 }}>Editar Usuario</h2>
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
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Nombre Completo</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
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

                    {/* Role Selection (Simplified for now, mapping back to Spanish UI terms could be added if needed, but using raw values or 'roles' array from data) */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Rol</label>
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
                            <option value="coordinator">Coordinator</option>
                            <option value="director">Director de Campus</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="rector">Rector</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    {shouldShowSchool && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Campus</label>
                            <select
                                name="school_id"
                                value={formData.school_id}
                                onChange={handleChange}
                                required={shouldShowSchool}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--bg-main)',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-main)'
                                }}
                            >
                                <option value="">Seleccionar Campus</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>{school.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

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
                            Cancelar
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
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
