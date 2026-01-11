import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import CoordinatorDashboard from '../components/Dashboard/CoordinatorDashboard';
import StrategicDashboard from '../components/Dashboard/StrategicDashboard';
import { TrendingUp, BarChart3 } from 'lucide-react';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*, schools(name)')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;
                setProfile(profileData);
            } else {
                setError('No se pudo encontrar la sesión del usuario.');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Error al cargar el perfil de usuario.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">Iniciando Dashboard...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-rose-500">
            <h3>{error}</h3>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded-md">
                Reintentar
            </button>
        </div>
    );

    // Normalize role for comparison
    const role = profile?.role?.toLowerCase();
    const isStrategicView = ['admin', 'rector', 'supervisor', 'director'].includes(role);

    if (isStrategicView) {
        return (
            <div className="dashboard">
                <div className="dashboard-header mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <TrendingUp className="text-indigo-600" size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Panel de Control Estratégico</h1>
                    </div>
                    <p className="subtitle text-slate-500">
                        {role === 'director' ? `Gestión del Campus: ${profile?.schools?.name || 'Cargando...'}` :
                            role === 'rector' ? 'Visión Estratégica Institucional y Calidad Educativa' :
                                role === 'supervisor' ? 'Supervisión de Procesos Pedagógicos' :
                                    'Administración del Consorcio'}
                    </p>
                </div>
                <StrategicDashboard userProfile={profile} />
            </div>
        );
    }

    if (role === 'coordinator') {
        return (
            <div className="dashboard">
                <div className="dashboard-header">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BarChart3 className="text-primary" size={24} />
                        </div>
                        <h1 className="text-2xl font-bold">Mi Seguimiento</h1>
                    </div>
                    <p className="subtitle text-slate-500">Gestión de Maestros y Observaciones Semanales</p>
                </div>
                <CoordinatorDashboard userProfile={profile} />
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Bienvenido</h1>
                <p className="subtitle">{profile?.full_name}</p>
            </div>
            <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-100">
                <p>Tu rol es: <strong>{profile?.role}</strong></p>
                <p className="mt-2 text-slate-500">No tienes un dashboard específico asignado todavía.</p>
            </div>
        </div>
    );
};

export default Dashboard;
