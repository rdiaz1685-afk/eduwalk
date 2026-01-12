import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Pencil, CircleCheck, UserCheck, CircleAlert, X, Upload, Trash2, Power, MoreVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import BulkTeacherUploadModal from '../components/Teacher/BulkTeacherUploadModal';
import { formatAppName } from '../utils/formatters';

const TeacherManagement = () => {
    console.log('TeacherManagement rendering');
    const [teachers, setTeachers] = useState([]);
    const [coordinators, setCoordinators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [schools, setSchools] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [currentUserSchoolId, setCurrentUserSchoolId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);

    useEffect(() => {
        fetchData();
        fetchUserRole();
    }, []);

    // ... (fetchUserRole and fetchData remain same)

    // ... (handleAssign and handleToggleStatus remain same)

    const handleEditClick = (teacher) => {
        setSelectedTeacherId(teacher.id);
        setNewTeacher({
            full_name: teacher.full_name,
            email: '', // Email not stored on teacher, so leave blank or ignore
            tenure_status: teacher.tenure_status,
            school_id: teacher.school_id
        });
        setShowAddModal(true);
    };

    const handleSaveTeacher = async () => {
        if (!newTeacher.full_name.trim()) {
            alert('Por favor ingresa el nombre completo del profesor');
            return;
        }

        if (!newTeacher.school_id) {
            alert('Por favor selecciona un campus');
            return;
        }

        try {
            if (selectedTeacherId) {
                // UPDATE existing teacher
                const { error } = await supabase
                    .from('teachers')
                    .update({
                        full_name: newTeacher.full_name.trim(),
                        tenure_status: newTeacher.tenure_status,
                        school_id: newTeacher.school_id
                    })
                    .eq('id', selectedTeacherId);

                if (error) throw error;
                alert('Profesor actualizado exitosamente');
            } else {
                // INSERT new teacher
                const { error } = await supabase
                    .from('teachers')
                    .insert([{
                        full_name: newTeacher.full_name.trim(),
                        tenure_status: newTeacher.tenure_status,
                        school_id: newTeacher.school_id
                    }]);

                if (error) throw error;
                alert('Profesor agregado exitosamente');
            }

            closeModal();
            fetchData();
        } catch (err) {
            alert('Error al guardar: ' + err.message);
        }
    };

    const closeModal = () => {
        setShowAddModal(false);
        setSelectedTeacherId(null);
        setNewTeacher({ full_name: '', email: '', tenure_status: 'new', school_id: '' });
    };

    // ... (handleToggleActive and related functions)

    if (loading) return <div className="p-8 text-center text-muted">Cargando datos de maestros...</div>;

    return (
        <div className="teacher-management p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Gestión de Maestros</h1>
                    <p className="text-muted">Asigna maestros, define su antigüedad y corrige nombres.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsBulkOpen(true)}
                        className="btn btn-secondary flex items-center gap-2"
                        style={{ background: 'white', border: '1px solid #e2e8f0', color: '#1e293b' }}
                    >
                        <Upload size={18} />
                        Importar
                    </button>
                    <button
                        onClick={() => {
                            setSelectedTeacherId(null);
                            setNewTeacher({ full_name: '', email: '', tenure_status: 'new', school_id: '' });
                            setShowAddModal(true);
                        }}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <UserPlus size={18} />
                        Agregar Profesor
                    </button>
                </div>
            </div>

            <div className="card mb-6 p-4">
                {/* Search Box Code ... */}
                <div className="search-box">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar maestro..."
                        className="premium-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {/* Filters... */}
                </div>
            </div>

            <div className="card table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Maestro</th>
                            <th>Estado</th>
                            <th>Campus</th>
                            <th>Tipo</th>
                            <th>Coordinador Asignado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeachers.map(teacher => (
                            <tr key={`${teacher.id}-${Date.now()}`} style={{ opacity: teacher.is_active ? 1 : 0.6 }}>
                                <td className="font-bold">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {teacher.full_name}
                                        {!teacher.is_active && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#e2e8f0', color: '#64748b' }}>Inactivo</span>}
                                    </div>
                                </td>
                                <td>
                                    {/* Toggle Active Button */}
                                    {canManageTeacher(teacher) ? (
                                        <button
                                            onClick={() => handleToggleActive(teacher.id, teacher.is_active)}
                                            className="btn-icon"
                                            title={teacher.is_active ? "Desactivar Maestro" : "Activar Maestro"}
                                            style={{ color: teacher.is_active ? '#22c55e' : '#cbd5e1' }}
                                        >
                                            <Power size={18} />
                                        </button>
                                    ) : (
                                        <Power size={18} style={{ color: '#cbd5e1', opacity: 0.5 }} title="Sin permisos" />
                                    )}
                                </td>
                                <td>{teacher.schools?.name || 'No asignado'}</td>
                                <td>
                                    {/* Tenure Status Badge */}
                                    {canManageTeacher(teacher) ? (
                                        <button
                                            onClick={() => handleToggleStatus(teacher.id, teacher.tenure_status)}
                                            className={`badge ${teacher.tenure_status}`}
                                            style={{ cursor: 'pointer', border: 'none' }}
                                        >
                                            {teacher.tenure_status === 'new' ? 'NUEVO (Semanal)' : 'ANTIGÜEDAD (15 días)'}
                                        </button>
                                    ) : (
                                        <span className={`badge ${teacher.tenure_status}`}>
                                            {teacher.tenure_status === 'new' ? 'NUEVO (Semanal)' : 'ANTIGÜEDAD (15 días)'}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    {/* Coordinator Assignment */}
                                    {canAssignCoordinators ? (
                                        <select
                                            className="premium-input"
                                            style={{ padding: '0.25rem', fontSize: '0.875rem' }}
                                            value={teacher.coordinator_id || ''}
                                            onChange={(e) => handleAssign(teacher.id, e.target.value || null)}
                                        >
                                            <option value="">Sin Asignar</option>
                                            {coordinators
                                                .filter(c => !teacher.school_id || c.school_id === teacher.school_id)
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{formatAppName(c.full_name)}</option>
                                                ))
                                            }
                                        </select>
                                    ) : (
                                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                                            {formatAppName(coordinators.find(c => c.id === teacher.coordinator_id)?.full_name) || 'Sin Asignar'}
                                        </span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {canManageTeacher(teacher) && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button
                                                onClick={() => handleEditClick(teacher)}
                                                className="btn-icon"
                                                title="Editar Profesor"
                                                style={{ color: '#3b82f6' }}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTeacher(teacher.id, teacher.full_name)}
                                                className="btn-icon"
                                                style={{ color: '#ef4444' }}
                                                title="Eliminar Profesor"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{selectedTeacherId ? 'Editar Profesor' : 'Agregar Nuevo Profesor'}</h2>
                            <button
                                onClick={closeModal}
                                className="btn-icon"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    className="premium-input"
                                    value={newTeacher.full_name}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, full_name: e.target.value })}
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                            <div className="form-group">
                                <label>Tipo de Profesor</label>
                                <select
                                    className="premium-input"
                                    value={newTeacher.tenure_status}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, tenure_status: e.target.value })}
                                >
                                    <option value="new">Nuevo (Semanal)</option>
                                    <option value="tenured">Antigüedad (15 días)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Campus</label>
                                <select
                                    className="premium-input"
                                    value={newTeacher.school_id}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, school_id: e.target.value })}
                                    disabled={currentUserRole !== 'admin' && !selectedTeacherId} // Admin can change always, others maybe restricted? Stick to logic: if editing, maybe let them fix it if they have access.
                                >
                                    <option value="">Seleccionar Campus</option>
                                    {schools.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={closeModal}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveTeacher}
                                className="btn btn-primary"
                            >
                                {selectedTeacherId ? 'Guardar Cambios' : 'Agregar Profesor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <BulkTeacherUploadModal
                isOpen={isBulkOpen}
                onClose={() => setIsBulkOpen(false)}
                onUploadComplete={() => {
                    fetchData();
                }}
            />
        </div>
    );
};

export default TeacherManagement;
