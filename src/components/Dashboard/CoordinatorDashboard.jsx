import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, CircleAlert, Clock, Calendar, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { WeekService } from '../../services/weekService';

const CoordinatorDashboard = ({ userProfile }) => {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile?.id) {
            fetchCoordinatorData();
        }
    }, [userProfile]);

    const fetchCoordinatorData = async () => {
        try {
            setLoading(true);

            // 1. Get current period ranges
            const currentWeek = WeekService.getCurrentWeek();
            const currentFortnight = WeekService.getCurrentFortnight();
            const weekRange = WeekService.getWeekDateRange(currentWeek);
            const fortnightRange = WeekService.getFortnightDateRange(currentFortnight);

            // 2. Fetch assigned teachers
            const { data: teachersData, error: teachersError } = await supabase
                .from('teachers')
                .select('*')
                .eq('coordinator_id', userProfile.id);

            if (teachersError) throw teachersError;

            // 3. Fetch all observations for these teachers to check current and history
            const teacherIds = teachersData.map(t => t.id);
            const { data: obsData, error: obsError } = await supabase
                .from('observations')
                .select('teacher_id, created_at')
                .in('teacher_id', teacherIds)
                .order('created_at', { ascending: false });

            if (obsError) throw obsError;

            // 4. Process Status (Green/Yellow)
            const processedTeachers = teachersData.map(teacher => {
                const observations = obsData.filter(o => o.teacher_id === teacher.id);
                const latestObs = observations[0];
                const lastDate = latestObs ? new Date(latestObs.created_at) : null;

                const isNew = teacher.tenure_status === 'new';
                const periodRange = isNew ? weekRange : fortnightRange;

                // Check if evaluated in current period
                const evaluatedThisPeriod = observations.some(obs => {
                    const d = new Date(obs.created_at);
                    return d >= periodRange.start && d <= periodRange.end;
                });

                const status = evaluatedThisPeriod ? 'completed' : 'pending';

                return {
                    ...teacher,
                    lastObservation: lastDate ? lastDate.toLocaleDateString() : 'Nunca',
                    evaluatedThisPeriod,
                    status,
                    periodName: isNew ? 'Semana' : 'Quincena'
                };
            });

            setTeachers(processedTeachers);
        } catch (err) {
            console.error('Error fetching coordinator dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTeacherClick = (teacherId) => {
        navigate('/observations', { state: { teacherId } });
    };

    const completedCount = teachers.filter(t => t.evaluatedThisPeriod).length;

    return (
        <div className="coordinator-dashboard">
            <div className="welcome-section card">
                <div className="flex justify-between items-center">
                    <div>
                        <h2>Hola, {userProfile?.full_name || 'Coordinador'}</h2>
                        <p className="text-muted">Tienes {teachers.length} maestros asignados para seguimiento.</p>
                    </div>
                    <div className="progress-circle">
                        <span className="text-2xl font-bold">{completedCount}/{teachers.length}</span>
                        <p className="text-xs">Observados este periodo</p>
                    </div>
                </div>
            </div>

            <h3 className="section-title mt-6">Estado del Periodo Actual</h3>
            <div className="teachers-status-grid">
                {loading ? (
                    <div className="p-8 text-center">Cargando maestros...</div>
                ) : teachers.length === 0 ? (
                    <div className="card p-8 text-center text-muted">
                        No tienes maestros asignados todavía.
                        Contacta a Rectoría para la asignación.
                    </div>
                ) : (
                    teachers.map(teacher => (
                        <div 
                            key={teacher.id} 
                            className={`status-card ${teacher.status}`}
                            onClick={() => handleTeacherClick(teacher.id)}
                            title={`Click para iniciar observación de ${teacher.full_name}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="user-info">
                                    <div className="avatar-small">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <h4>{teacher.full_name}</h4>
                                        <span className={`badge ${teacher.tenure_status}`}>
                                            {teacher.tenure_status === 'new' ? 'NUEVO' : 'ANTIGÜEDAD'}
                                        </span>
                                    </div>
                                </div>
                                <div className={`status-icon ${teacher.status}`}>
                                    {teacher.status === 'completed' ? <CircleCheck size={20} /> : <CircleAlert size={20} />}
                                </div>
                            </div>

                            <div className="meta-info">
                                <div className="info-row">
                                    <Clock size={14} />
                                    <span>Última: {teacher.lastObservation}</span>
                                </div>
                                <div className="info-row mt-2">
                                    <Calendar size={14} />
                                    <span>
                                        {teacher.status === 'completed'
                                            ? '¡Completado esta ' + teacher.periodName + '!'
                                            : 'Pendiente para esta ' + teacher.periodName}
                                    </span>
                                </div>
                            </div>

                            <div className="progress-bar-bg mt-4">
                                <div
                                    className={`progress-bar-fill ${teacher.status}`}
                                    style={{ width: teacher.status === 'completed' ? '100%' : '100%' }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CoordinatorDashboard;
