import React, { useState, useEffect } from 'react';
import { Users, Shield, TrendingUp, CircleCheck, CircleAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { WeekService } from '../../services/weekService';
import { formatAppName } from '../../utils/formatters';

const AdminDashboard = ({ userProfile }) => {
    const [coordinators, setCoordinators] = useState([]);
    const [stats, setStats] = useState({
        totalTeachers: 0,
        totalObservations: 0,
        globalCompliance: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, [userProfile]);

    const fetchAdminData = async () => {
        try {
            setLoading(true);

            // Get current periods
            const currentWeek = WeekService.getCurrentWeek();
            const currentFortnight = WeekService.getCurrentFortnight();
            const weekRange = WeekService.getWeekDateRange(currentWeek);
            const fortnightRange = WeekService.getFortnightDateRange(currentFortnight);

            // 1. Fetch coordinators
            let coordQuery = supabase
                .from('profiles')
                .select('*')
                .eq('role', 'coordinator');

            if (userProfile?.role === 'director' && userProfile.school_id) {
                coordQuery = coordQuery.eq('school_id', userProfile.school_id);
            }

            const { data: profiles, error: profilesError } = await coordQuery;
            if (profilesError) throw profilesError;

            // 2. Fetch teachers
            let teacherQuery = supabase.from('teachers').select('*');
            if (userProfile?.role === 'director' && userProfile.school_id) {
                teacherQuery = teacherQuery.eq('school_id', userProfile.school_id);
            }

            const { data: teachers, error: teachersError } = await teacherQuery;
            if (teachersError) throw teachersError;

            // 3. Fetch observations for current periods
            // We need observations from the start of the current fortnight (which covers both newest and tenured)
            let obsQuery = supabase
                .from('observations')
                .select('teacher_id, created_at')
                .gte('created_at', fortnightRange.start.toISOString());

            const { data: observations, error: obsError } = await obsQuery;
            if (obsError) throw obsError;

            // 4. Process compliance for each coordinator
            const coordinatorStats = profiles.map(coord => {
                const coordTeachers = teachers.filter(t => t.coordinator_id === coord.id);
                let onTrack = 0;

                coordTeachers.forEach(teacher => {
                    const isNew = teacher.tenure_status === 'new';
                    const range = isNew ? weekRange : fortnightRange;

                    const hasObservation = observations.some(o =>
                        o.teacher_id === teacher.id &&
                        new Date(o.created_at) >= range.start &&
                        new Date(o.created_at) <= range.end
                    );

                    if (hasObservation) onTrack++;
                });

                const compliancePercent = coordTeachers.length > 0
                    ? Math.round((onTrack / coordTeachers.length) * 100)
                    : 0;

                return {
                    id: coord.id,
                    name: formatAppName(coord.full_name),
                    teachersCount: coordTeachers.length,
                    onTrack,
                    compliance: compliancePercent
                };
            });

            setCoordinators(coordinatorStats);

            // Global stats
            const totalOnTrack = coordinatorStats.reduce((sum, c) => sum + c.onTrack, 0);
            const totalTeachers = teachers.length;

            // Also fetch total observations count for the school (or global)
            let totalObsQuery = supabase.from('observations').select('id', { count: 'exact', head: true });
            if (userProfile?.role === 'director') {
                totalObsQuery = totalObsQuery.in('teacher_id', teachers.map(t => t.id));
            }
            const { count: totalObsCount } = await totalObsQuery;

            setStats({
                totalTeachers,
                totalObservations: totalObsCount || 0,
                globalCompliance: totalTeachers > 0 ? Math.round((totalOnTrack / totalTeachers) * 100) : 0
            });

        } catch (err) {
            console.error('Error fetching admin dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

    return (
        <div className="admin-dashboard">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon blue"><Users size={24} /></div>
                        <div>
                            <p className="text-muted text-sm">Total Maestros</p>
                            <h3>{stats.totalTeachers}</h3>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon green"><TrendingUp size={24} /></div>
                        <div>
                            <p className="text-muted text-sm">Cumplimiento Global</p>
                            <h3>{stats.globalCompliance}%</h3>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon indigo"><Shield size={24} /></div>
                        <div>
                            <p className="text-muted text-sm">Observaciones Totales</p>
                            <h3>{stats.totalObservations}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-content-grid mt-6">
                <div className="card">
                    <div className="card-header">
                        <h3>Cumplimiento por Coordinador</h3>
                    </div>
                    <div className="p-4">
                        <div className="chart-container" style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={coordinators} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip />
                                    <Bar dataKey="compliance" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>Detalle de Coordinadores</h3>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Coordinador</th>
                                    <th>Maestros</th>
                                    <th>Al día</th>
                                    <th>Progreso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coordinators.map(coord => (
                                    <tr key={coord.id}>
                                        <td>{coord.name}</td>
                                        <td>{coord.teachersCount}</td>
                                        <td>{coord.onTrack}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="progress-bar-bg flex-1">
                                                    <div
                                                        className="progress-bar-fill indigo"
                                                        style={{ width: `${coord.compliance}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold">{coord.compliance}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
