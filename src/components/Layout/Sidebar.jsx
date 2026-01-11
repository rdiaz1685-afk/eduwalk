import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardCheck,
    FileText,
    Settings,
    LogOut,
    GraduationCap,
    Users,
    BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import '../../styles/Sidebar.css';

const Sidebar = () => {
    const [role, setRole] = React.useState(null);
    const navigate = useNavigate();

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                supabase.from('profiles').select('role').eq('id', user.id).single()
                    .then(({ data }) => setRole(data?.role?.toLowerCase()));
            }
        });
    }, []);

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
        { icon: <ClipboardCheck size={20} />, label: 'Observations', path: '/observations' },
        { icon: <FileText size={20} />, label: 'Reports', path: '/reports' },
        ...(['admin', 'director', 'rector', 'supervisor'].includes(role) ? [{ icon: <BarChart3 size={20} />, label: 'Cumplimiento', path: '/compliance' }] : []),
        { icon: <Users size={20} />, label: 'Team', path: '/team' },
        ...(['admin', 'director', 'rector', 'supervisor', 'coordinator'].includes(role) ? [{ icon: <GraduationCap size={20} />, label: 'Teachers', path: '/teachers' }] : []),
        { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <GraduationCap size={32} color="var(--primary-light)" />
                    <h1>EduWalk</h1>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleSignOut}>
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
