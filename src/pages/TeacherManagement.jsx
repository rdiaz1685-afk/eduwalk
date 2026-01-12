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
    const [assignmentFilter, setAssignmentFilter] = useState('all'); // all, assigned, unassigned
    const [campusFilter, setCampusFilter] = useState('all');
    const [newTeacher, setNewTeacher] = useState({
        full_name: '',
        email: '',
        tenure_status: 'new',
        school_id: ''
    });

    useEffect(() => {
        fetchData();
        fetchUserRole();
    }, []);

    const fetchUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('role, school_id')
                .eq('id', user.id)
                .single();
            setCurrentUserRole(data?.role);
            setCurrentUserSchoolId(data?.school_id);
            setCurrentUserId(user.id);

            // If user has a specific school and is NOT admin, pre-set the school_id
            if (data?.school_id && data?.role !== 'admin') {
                setNewTeacher(prev => ({ ...prev, school_id: data.school_id }));
            }
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: teachersData } = await supabase
                .from('teachers')
                .select('*, schools(name)')
                .order('full_name');

            const { data: coordsData } = await supabase
                .from('profiles')
                .select('id, full_name, school_id')
                .eq('role', 'coordinator');

            const { data: schoolsData } = await supabase
                .from('schools')
                .select('*')
                .order('name');

            setTeachers(teachersData || []);
            setCoordinators(coordsData || []);
            setSchools(schoolsData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (teacherId, coordinatorId) => {
        console.log('Attempting to assign:', { teacherId, coordinatorId });
        try {
            const { error } = await supabase
                .from('teachers')
                .update({ coordinator_id: coordinatorId })
                .eq('id', teacherId);

            if (error) {
                console.error('Database update error:', error);
                throw error;
            }

            console.log('Assignment successful, refetching...');
            fetchData();
        } catch (err) {
            console.error('Final catch error:', err);
            alert('Error al asignar: ' + (err.message || 'Error desconocido'));
        }
    };

    const handleToggleStatus = async (teacherId, currentStatus) => {
        const nextStatus = currentStatus === 'new' ? 'tenured' : 'new';
        try {
            const { error } = await supabase
                .from('teachers')
                .update({ tenure_status: nextStatus })
                .eq('id', teacherId);

            if (error) throw error;
            fetchData();
        } catch (err) {
            alert('Error al cambiar status: ' + err.message);
        }
    };

    const handleAddTeacher = async () => {
        if (!newTeacher.full_name.trim()) {
            alert('Por favor ingresa el nombre completo del profesor');
            return;
        }

        if (!newTeacher.school_id) {
            alert('Por favor selecciona un campus');
            return;
        }

        try {
            const { error } = await supabase
                .from('teachers')
                .insert([{
                    full_name: newTeacher.full_name.trim(),
                    tenure_status: newTeacher.tenure_status,
                    school_id: newTeacher.school_id
                }]);

            if (error) throw error;

            setShowAddModal(false);
            setNewTeacher({ full_name: '', email: '', tenure_status: 'new', school_id: '' });
            fetchData();
            alert('Profesor agregado exitosamente');
        } catch (err) {
            alert('Error al agregar profesor: ' + err.message);
        }
    };

    const handleToggleActive = async (teacherId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('teachers')
                .update({ is_active: !currentStatus })
                .eq('id', teacherId);

            if (error) throw error;
            fetchData();
        } catch (err) {
            alert('Error al cambiar estado activo: ' + err.message);
        }
    };

    const handleDeleteTeacher = async (teacherId, teacherName) => {
        if (!window.confirm(`¿Estás seguro de eliminar a ${teacherName}?`)) return;

        try {
            // Attempt delete directly
            const { error: deleteError } = await supabase
                .from('teachers')
                .delete()
                .eq('id', teacherId);

            if (deleteError) {
                // Check if it's a foreign key violation (Postgres code 23503)
                if (deleteError.code === '23503' || deleteError.message?.includes('foreign key constraint')) {
                    alert(`El maestro ${teacherName} ya cuenta con historial de observaciones (evaluaciones), por lo que no es posible eliminarlo definitivamente de la base de datos.\n\nEn su lugar, ha sido DESACTIVADO. Esto significa que ya no aparecerá en las listas de asignación, pero sus datos históricos se conservan.`);

                    // Automatically deactivate
                    await supabase.from('teachers').update({ is_active: false }).eq('id', teacherId);
                    fetchData();
                    return;
                }
                throw deleteError;
            }

            alert('Profesor eliminado correctamente');
            fetchData();
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        }
    };

    const filteredTeachers = (teachers || []).filter(t => {
        const matchesSearch = (t.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase());

        let matchesAssignment = true;
        if (assignmentFilter === 'assigned') matchesAssignment = !!t.coordinator_id;
        if (assignmentFilter === 'unassigned') matchesAssignment = !t.coordinator_id;

        const matchesCampus = campusFilter === 'all' || t.school_id === campusFilter;

        let matchesRole = true;
        if (currentUserRole === 'coordinator') {
            // Coordinator only sees their own assigned teachers
            matchesRole = t.coordinator_id === currentUserId;
        } else if (['director', 'principal'].includes(currentUserRole)) {
            matchesRole = t.school_id === currentUserSchoolId;
        }

        return matchesSearch && matchesAssignment && matchesCampus && matchesRole;
    });

    const canManageTeacher = (teacher) => {
        if (!currentUserRole) return false;
        if (['admin', 'rector', 'supervisor'].includes(currentUserRole)) return true;
        if (['director', 'principal'].includes(currentUserRole)) {
            return teacher.school_id === currentUserSchoolId;
        }
        if (currentUserRole === 'coordinator') {
            return teacher.coordinator_id === currentUserId;
        }
        return false;
    };

    const canAssignCoordinators = ['admin', 'director', 'principal', 'rector', 'supervisor'].includes(currentUserRole);

    if (loading) return <div className="p-8 text-center text-muted">Cargando datos de maestros...</div>;

    return (
        <div className="teacher-management p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Gestión de Maestros</h1>
                    <p className="text-muted">Asigna maestros a coordinadores y define su antigüedad.</p>
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
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <UserPlus size={18} />
                        Agregar Profesor
                    </button>
                </div>
            </div>

            <div className="card mb-6 p-4">
                <div className="search-box">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar maestro..."
                        className="premium-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {['admin', 'director', 'principal', 'rector', 'supervisor'].includes(currentUserRole) && (
                        <div className="flex gap-2">
                            {['admin', 'rector', 'supervisor'].includes(currentUserRole) && (
                                <select
                                    className="premium-input"
                                    value={campusFilter}
                                    onChange={(e) => setCampusFilter(e.target.value)}
                                    style={{ width: '200px' }}
                                >
                                    <option value="all">Todos los Campus</option>
                                    {schools.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            )}
                            <select
                                className="premium-input"
                                value={assignmentFilter}
                                onChange={(e) => setAssignmentFilter(e.target.value)}
                                style={{ width: '200px' }}
                            >
                                <option value="all">Todos los Maestros</option>
                                <option value="assigned">Asignados</option>
                                <option value="unassigned">Sin Asignar</option>
                            </select>
                        </div>
                    )}
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
                                <td>
                                    {teacher.coordinator_id ? <UserCheck className="text-success" size={18} /> : <CircleAlert className="text-muted" size={18} />}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {canManageTeacher(teacher) && (
                                        <button
                                            onClick={() => handleDeleteTeacher(teacher.id, teacher.full_name)}
                                            className="btn-icon"
                                            style={{ color: '#ef4444' }}
                                            title="Eliminar Profesor"
                                        >
                                            <Trash2 size={18} />
                                        </button>
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
                            <h2>Agregar Nuevo Profesor</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
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
                                    disabled={currentUserRole !== 'admin'}
                                >
                                    <option value="">Seleccionar Campus</option>
                                    {schools.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {currentUserRole !== 'admin' && (
                                    <small className="text-muted" style={{ display: 'block', marginTop: '4px' }}>
                                        Solo el administrador general puede cambiar el campus.
                                    </small>
                                )}
                            </div>
                            <div className="form-group">
                                <small style={{ color: 'var(--text-muted)' }}>
                                    Nota: El correo electrónico no se guarda en esta tabla.
                                    Si necesitas crear un usuario con acceso al sistema,
                                    usa la sección de "Gestión de Equipo".
                                </small>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddTeacher}
                                className="btn btn-primary"
                            >
                                Agregar Profesor
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
