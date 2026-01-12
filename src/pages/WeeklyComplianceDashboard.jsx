import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Users,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Clock,
    Filter,
    RefreshCw,
    Eye,
    BarChart3,
    CalendarDays
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { WeekService } from '../services/weekService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatAppName } from '../utils/formatters';
import './WeeklyComplianceDashboard.css';

const WeeklyComplianceDashboard = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [viewType, setViewType] = useState('weekly'); // weekly or fortnightly
    const [currentWeek, setCurrentWeek] = useState(WeekService.getCurrentWeek());
    const [currentFortnight, setCurrentFortnight] = useState(WeekService.getCurrentFortnight());
    const [complianceData, setComplianceData] = useState(null);
    const [coordinatorData, setCoordinatorData] = useState([]);
    const [selectedCoordinator, setSelectedCoordinator] = useState('all');
    const [campusFilter, setCampusFilter] = useState('all');
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historicalData, setHistoricalData] = useState([]);
    const [showDetails, setShowDetails] = useState(false);
    const [remainingDays, setRemainingDays] = useState(null);

    useEffect(() => {
        if (user) {
            supabase.from('profiles').select('*').eq('id', user.id).single()
                .then(({ data }) => setProfile(data));
        }
    }, [user]);

    useEffect(() => {
        if (profile) {
            fetchComplianceData();
            fetchCoordinatorList();
            fetchHistoricalData();
            fetchSchools();
            updateRemainingDays();
        }
    }, [profile, viewType, currentWeek, currentFortnight, selectedCoordinator, campusFilter]);

    const updateRemainingDays = () => {
        const days = WeekService.getRemainingDays(viewType, viewType === 'weekly' ? currentWeek : currentFortnight);
        setRemainingDays(days);
    };
    const fetchComplianceData = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            // Get BOTH ranges for smart compliance calculation
            const weeklyRange = WeekService.getWeekDateRange(currentWeek);
            const fortnightlyRange = WeekService.getFortnightDateRange(currentFortnight);

            // 1. Fetch relevant coordinators
            let profilesQuery = supabase
                .from('profiles')
                .select('id, full_name, email, school_id')
                .eq('role', 'coordinator');

            if (profile.role === 'director' && profile.school_id) {
                profilesQuery = profilesQuery.eq('school_id', profile.school_id);
            } else if (profile.role === 'rector' && campusFilter !== 'all') {
                profilesQuery = profilesQuery.eq('school_id', campusFilter);
            }

            const { data: coordinatorsData, error: profilesError } = await profilesQuery;
            if (profilesError) throw profilesError;

            // 2. Fetch all teachers managed by these coordinators
            const coordinatorIds = (coordinatorsData || []).map(c => c.id);
            if (coordinatorIds.length === 0) {
                setComplianceData(processComplianceData([], [], [], profile, weeklyRange, fortnightlyRange)); // empty
                setCoordinatorData([]);
                setLoading(false);
                return;
            }

            let teachersQuery = supabase
                .from('teachers')
                .select('id, full_name, school_id, coordinator_id, tenure_status')
                .in('coordinator_id', coordinatorIds);

            const { data: teachersData, error: teachersError } = await teachersQuery;
            if (teachersError) throw teachersError;

            const teacherIds = (teachersData || []).map(t => t.id);

            // 3. Fetch all observations for these teachers within the max range
            // We use the start of the fortnight range to be safe (it covers week range too usually)
            // Relax the filter by 30 days to avoid potential timezone truncation issues at the start boundary
            const baseDate = fortnightlyRange.start < weeklyRange.start ? fortnightlyRange.start : weeklyRange.start;
            const safeEarliestDate = new Date(baseDate);
            safeEarliestDate.setDate(safeEarliestDate.getDate() - 30);

            let obsQuery = supabase
                .from('observations')
                .select('id, created_at, teacher_id')
                .in('teacher_id', teacherIds)
                .gte('created_at', safeEarliestDate.toISOString());

            const { data: obsData, error: obsError } = await obsQuery;
            if (obsError) throw obsError;

            // Process data by stitching arrays
            const processedData = processComplianceData(coordinatorsData, teachersData, obsData, profile, weeklyRange, fortnightlyRange);
            setComplianceData(processedData);
            setCoordinatorData(processedData.coordinators);
        } catch (error) {
            console.error('Error fetching compliance data:', error);
            setComplianceData(getMockData());
            setCoordinatorData(getMockData().coordinators);
        } finally {
            setLoading(false);
        }
    };

    const processComplianceData = (coordinatorsList, teachersList, observationsList, viewerProfile, weeklyRange, fortnightlyRange) => {
        const coordinators = coordinatorsList.map(coordinator => {
            let teachers = teachersList.filter(t => t.coordinator_id === coordinator.id);
            if (viewerProfile?.role === 'director' && viewerProfile.school_id) {
                teachers = teachers.filter(t => t.school_id === viewerProfile.school_id);
            }
            const totalTeachers = teachers.length;

            const teachersWithObservations = teachers.filter(teacher => {
                const observations = observationsList.filter(o => o.teacher_id === teacher.id);

                // Smart Logic: Determine applicable range based on tenure status
                const isNew = teacher.tenure_status === 'new';
                // If ranges are provided (smart mode), use them. Otherwise fallback to defaultDateRange
                const targetRange = (weeklyRange && fortnightlyRange)
                    ? (isNew ? weeklyRange : fortnightlyRange)
                    : defaultDateRange;

                return observations.some(obs => {
                    const obsDate = new Date(obs.created_at);

                    // Normalize range to cover full days
                    const start = new Date(targetRange.start);
                    start.setHours(0, 0, 0, 0);

                    const end = new Date(targetRange.end);
                    end.setHours(23, 59, 59, 999);

                    return obsDate >= start && obsDate <= end;
                });
            });

            const pendingTeachers = teachers.filter(teacher => {
                const observations = observationsList.filter(o => o.teacher_id === teacher.id);

                // Smart Logic: Determine applicable range based on tenure status
                const isNew = teacher.tenure_status === 'new';
                // If ranges are provided (smart mode), use them. Otherwise fallback to defaultDateRange
                const targetRange = (weeklyRange && fortnightlyRange)
                    ? (isNew ? weeklyRange : fortnightlyRange)
                    : defaultDateRange;

                const hasObservationInRange = observations.some(obs => {
                    const obsDate = new Date(obs.created_at);

                    // Normalize range to cover full days
                    const start = new Date(targetRange.start);
                    start.setHours(0, 0, 0, 0);

                    const end = new Date(targetRange.end);
                    end.setHours(23, 59, 59, 999);

                    return obsDate >= start && obsDate <= end;
                });
                return !hasObservationInRange;
            });

            return {
                coordinator_id: coordinator.id,
                coordinator_name: coordinator.full_name,
                coordinator_email: coordinator.email,
                total_teachers: totalTeachers,
                completed_observations: teachersWithObservations.length,
                teachers_with_observations: teachersWithObservations.length,
                compliance_rate: totalTeachers > 0 ?
                    (teachersWithObservations.length / totalTeachers * 100).toFixed(1) : 0,
                pending_teachers: pendingTeachers.map(t => t.full_name).join(', ')
            };
        });

        const totalTeachers = coordinators.reduce((sum, c) => sum + c.total_teachers, 0);
        const totalCompleted = coordinators.reduce((sum, c) => sum + c.teachers_with_observations, 0);

        return {
            summary: {
                total_coordinators: coordinators.length,
                total_teachers: totalTeachers,
                total_completed: totalCompleted,
                overall_compliance: totalTeachers > 0 ?
                    (totalCompleted / totalTeachers * 100).toFixed(1) : 0
            },
            coordinators
        };
    };

    const fetchCoordinatorList = async () => {
        try {
            let query = supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('role', 'coordinator')
                .order('full_name');

            if (profile?.role === 'rector' && campusFilter !== 'all') {
                query = query.eq('school_id', campusFilter);
            }

            const { data, error } = await query;

            if (!error && data) {
                // Agregar opción "Todos" al inicio
                const coordinators = [
                    { id: 'all', full_name: 'Todos los coordinadores' },
                    ...data
                ];
                // Actualizar el estado si es necesario
            }
        } catch (error) {
            console.error('Error fetching coordinators:', error);
        }
    };

    const fetchSchools = async () => {
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .order('name');
            if (error) throw error;
            setSchools(data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
        }
    };

    const fetchHistoricalData = async () => {
        try {
            const periods = viewType === 'weekly' ? 8 : 4;
            const historical = [];

            for (let i = periods - 1; i >= 0; i--) {
                const periodNumber = viewType === 'weekly'
                    ? Math.max(1, currentWeek - i)
                    : Math.max(1, currentFortnight - i);

                const dateRange = viewType === 'weekly'
                    ? WeekService.getWeekDateRange(periodNumber)
                    : WeekService.getFortnightDateRange(periodNumber);

                // Simular datos históricos (en producción vendrían de la BD)
                const mockCompliance = 70 + Math.random() * 30;
                historical.push({
                    period: periodNumber,
                    label: viewType === 'weekly' ? `Sem. ${periodNumber}` : `Quinc. ${periodNumber}`,
                    fullLabel: viewType === 'weekly' ? `Semana ${periodNumber}` : `Quincena ${periodNumber}`,
                    dateRange: dateRange.display,
                    compliance: parseFloat(mockCompliance.toFixed(1)),
                    status: mockCompliance >= 100 ? 'compliant' :
                        mockCompliance >= 80 ? 'partial' : 'non-compliant'
                });
            }

            setHistoricalData(historical);
        } catch (error) {
            console.error('Error fetching historical data:', error);
        }
    };

    const getMockData = () => {
        return {
            summary: {
                total_coordinators: 4,
                total_teachers: 25,
                total_completed: 18,
                overall_compliance: 72.0
            },
            coordinators: [
                {
                    coordinator_id: '1',
                    coordinator_name: 'María González',
                    total_teachers: 8,
                    completed_observations: 8,
                    teachers_with_observations: 8,
                    compliance_rate: 100.0,
                    pending_teachers: ''
                },
                {
                    coordinator_id: '2',
                    coordinator_name: 'Juan Pérez',
                    total_teachers: 6,
                    completed_observations: 4,
                    teachers_with_observations: 4,
                    compliance_rate: 66.7,
                    pending_teachers: 'Ana López, Carlos Ruiz'
                },
                {
                    coordinator_id: '3',
                    coordinator_name: 'Laura Martínez',
                    total_teachers: 7,
                    completed_observations: 5,
                    teachers_with_observations: 5,
                    compliance_rate: 71.4,
                    pending_teachers: 'Roberto Sánchez'
                },
                {
                    coordinator_id: '4',
                    coordinator_name: 'Diego Hernández',
                    total_teachers: 4,
                    completed_observations: 1,
                    teachers_with_observations: 1,
                    compliance_rate: 25.0,
                    pending_teachers: 'Patricia Morales, Miguel Ángel Torres, Sofía Vargas'
                }
            ]
        };
    };

    const getStatusColor = (rate) => {
        if (rate >= 100) return 'success';
        if (rate >= 80) return 'warning';
        return 'danger';
    };

    const getStatusIcon = (rate) => {
        if (rate >= 100) return <CheckCircle size={20} className="text-success" />;
        if (rate >= 80) return <AlertTriangle size={20} className="text-warning" />;
        return <AlertTriangle size={20} className="text-danger" />;
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'critical': return 'danger';
            case 'high': return 'warning';
            case 'medium': return 'info';
            default: return 'success';
        }
    };

    const getUrgencyIcon = (urgency) => {
        switch (urgency) {
            case 'critical': return <AlertTriangle size={16} className="text-danger" />;
            case 'high': return <Clock size={16} className="text-warning" />;
            case 'medium': return <CalendarDays size={16} className="text-info" />;
            default: return <CheckCircle size={16} className="text-success" />;
        }
    };

    const handlePreviousPeriod = () => {
        if (viewType === 'weekly') {
            setCurrentWeek(Math.max(1, currentWeek - 1));
        } else {
            setCurrentFortnight(Math.max(1, currentFortnight - 1));
        }
    };

    const handleNextPeriod = () => {
        if (viewType === 'weekly') {
            setCurrentWeek(currentWeek + 1);
        } else {
            setCurrentFortnight(currentFortnight + 1);
        }
    };

    const handleRefresh = () => {
        fetchComplianceData();
        fetchHistoricalData();
        updateRemainingDays();
    };

    const currentDateRange = viewType === 'weekly'
        ? WeekService.getWeekDateRange(currentWeek)
        : WeekService.getFortnightDateRange(currentFortnight);

    if (loading && !complianceData) {
        return (
            <div className="compliance-dashboard loading">
                <div className="loading-content">
                    <RefreshCw className="animate-spin" size={48} />
                    <h3>Cargando datos de cumplimiento...</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="compliance-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1>
                            <BarChart3 size={32} />
                            Dashboard de Cumplimiento
                        </h1>
                        <p className="subtitle">
                            Seguimiento de observaciones por coordinador
                        </p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {profile?.role === 'rector' && (
                            <select
                                value={campusFilter}
                                onChange={(e) => setCampusFilter(e.target.value)}
                                className="campus-select"
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    color: '#1e293b',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="all">🏢 Todos los Campus</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>
                                        {school.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <button onClick={handleRefresh} className="btn btn-outline">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Remaining Days Alert */}
                {remainingDays && (
                    <div className={`remaining-days-alert ${getUrgencyColor(remainingDays.urgencyLevel)}`}>
                        <div className="alert-content">
                            <div className="alert-icon">
                                {getUrgencyIcon(remainingDays.urgencyLevel)}
                            </div>
                            <div className="alert-text">
                                <h4>
                                    {remainingDays.isWeekend ? 'Fin de Semana' :
                                        remainingDays.todayIsWorkDay ? 'Hoy es día de observación' :
                                            'Día no laborable'}
                                </h4>
                                <p>
                                    {remainingDays.periodLabel}: {remainingDays.remainingDays} de {remainingDays.totalWorkDays} días restantes para observaciones
                                    {remainingDays.remainingDays > 0 && (
                                        <span> (Próximo: {remainingDays.remainingDates[0]?.toLocaleDateString()})</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Period Navigation */}
                <div className="period-navigation">
                    <div className="period-selector">
                        <button
                            onClick={handlePreviousPeriod}
                            className="nav-btn"
                            disabled={currentWeek <= 1 && currentFortnight <= 1}
                        >
                            ←
                        </button>
                        <div className="period-info">
                            <span className="period-label">
                                {viewType === 'weekly' ? `Semana ${currentWeek}` : `Quincena ${currentFortnight}`}
                            </span>
                            <span className="period-dates">{currentDateRange.display}</span>
                        </div>
                        <button onClick={handleNextPeriod} className="nav-btn">
                            →
                        </button>
                    </div>

                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewType === 'weekly' ? 'active' : ''}`}
                            onClick={() => setViewType('weekly')}
                        >
                            Semanal
                        </button>
                        <button
                            className={`toggle-btn ${viewType === 'fortnightly' ? 'active' : ''}`}
                            onClick={() => setViewType('fortnightly')}
                        >
                            Quincenal
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card">
                    <div className="card-icon">
                        <Users size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-value">{complianceData?.summary?.total_teachers || 0}</span>
                        <span className="card-label">Total Maestros</span>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-icon">
                        <CheckCircle size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-value">{complianceData?.summary?.total_completed || 0}</span>
                        <span className="card-label">Observaciones Completadas</span>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-value">{complianceData?.summary?.overall_compliance || 0}%</span>
                        <span className="card-label">Cumplimiento General</span>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="card-icon">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="card-content">
                        <span className="card-value">
                            {(complianceData?.summary?.total_teachers - complianceData?.summary?.total_completed) || 0}
                        </span>
                        <span className="card-label">Pendientes</span>
                    </div>
                </div>
            </div>

            <div className="historical-section">
                <div className="section-header">
                    <h2>
                        <TrendingUp size={20} />
                        Tendencia Histórica de Cumplimiento
                    </h2>
                </div>
                <div className="trend-chart-container" style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={historicalData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                domain={[0, 100]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(value) => [`${value}%`, 'Cumplimiento']}
                                labelFormatter={(label, payload) => {
                                    if (payload && payload[0]) {
                                        return payload[0].payload.fullLabel;
                                    }
                                    return label;
                                }}
                            />
                            <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: 'Meta', fill: '#f59e0b', fontSize: 10 }} />
                            <Area
                                type="monotone"
                                dataKey="compliance"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCompliance)"
                                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Coordinator Compliance Table */}
            <div className="coordinator-section">
                <div className="section-header">
                    <h2>
                        <Users size={20} />
                        Cumplimiento de Observaciones por Coordinador
                    </h2>
                    <div className="section-actions">
                        <select
                            value={selectedCoordinator}
                            onChange={(e) => setSelectedCoordinator(e.target.value)}
                            className="coordinator-filter"
                        >
                            <option value="all">Todos los coordinadores</option>
                            {coordinatorData.map(coord => (
                                <option key={coord.coordinator_id} value={coord.coordinator_id}>
                                    {formatAppName(coord.coordinator_name, coord.coordinator_email)}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="btn btn-outline"
                        >
                            <Eye size={18} />
                            {showDetails ? 'Ocultar' : 'Ver'} Detalles
                        </button>
                    </div>
                </div>

                <div className="coordinator-grid">
                    {coordinatorData.map((coordinator) => (
                        <div
                            key={coordinator.coordinator_id}
                            className={`coordinator-card ${getStatusColor(coordinator.compliance_rate)}`}
                        >
                            <div className="coordinator-header">
                                <div className="coordinator-info">
                                    <h3>{formatAppName(coordinator.coordinator_name, coordinator.coordinator_email)}</h3>
                                    <div className="coordinator-stats">
                                        <span className="stat">
                                            {coordinator.teachers_with_observations}/{coordinator.total_teachers}
                                        </span>
                                        <span className="compliance-rate">
                                            {coordinator.compliance_rate}%
                                        </span>
                                    </div>
                                </div>
                                <div className="status-icon">
                                    {getStatusIcon(coordinator.compliance_rate)}
                                </div>
                            </div>

                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${getStatusColor(coordinator.compliance_rate)}`}
                                    style={{ width: `${coordinator.compliance_rate}%` }}
                                />
                            </div>

                            {showDetails && coordinator.pending_teachers && (
                                <div className="pending-details">
                                    <h4>
                                        <AlertTriangle size={16} />
                                        Maestros pendientes de observación:
                                    </h4>
                                    <p>{coordinator.pending_teachers}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WeeklyComplianceDashboard;
