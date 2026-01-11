import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ChangePasswordForm from '../components/Settings/ChangePasswordForm';
import {
    Settings as SettingsIcon,
    Database,
    Cloud,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    ToggleRight,
    ToggleLeft,
    User,
    Mail,
    Shield
} from 'lucide-react';
import '../styles/Settings.css';

const Settings = () => {
    const { user } = useAuth();
    const [integrations, setIntegrations] = useState({
        oneroster: { connected: true, lastSync: '10 mins ago', status: 'Healthy' },
        google: { connected: false, lastSync: '-', status: 'Disconnected' }
    });

    const toggleIntegration = (key) => {
        setIntegrations(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                connected: !prev[key].connected,
                status: !prev[key].connected ? 'Connecting...' : 'Disconnected'
            }
        }));

        // Simulate connection delay
        if (!integrations[key].connected) {
            setTimeout(() => {
                setIntegrations(prev => ({
                    ...prev,
                    [key]: { ...prev[key], status: 'Healthy', lastSync: 'Just now' }
                }));
            }, 1500);
        }
    };

    return (
        <div className="settings-container">
            <div className="page-header">
                <div>
                    <h1>Configuración</h1>
                    <p className="subtitle">Administra tu cuenta, integraciones y preferencias</p>
                </div>
            </div>

            {/* User Profile & Password Section */}
            <div className="settings-section">
                <h2 className="section-title">Mi Cuenta</h2>
                <div className="settings-grid">
                    <div className="card profile-card">
                        <div className="card-header">
                            <h3>Información de Perfil</h3>
                        </div>
                        <div className="profile-info">
                            <div className="info-item">
                                <Mail size={18} />
                                <div>
                                    <label>Email</label>
                                    <p>{user?.email}</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <User size={18} />
                                <div>
                                    <label>Nombre</label>
                                    <p>{user?.user_metadata?.full_name || 'No especificado'}</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <Shield size={18} />
                                <div>
                                    <label>Rol</label>
                                    <p>{user?.user_metadata?.role || 'No especificado'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <ChangePasswordForm />
                    </div>
                </div>
            </div>

            {/* Integrations Section */}
            <div className="settings-section">
                <h2 className="section-title">Integraciones</h2>
                <div className="settings-grid">
                    <div className="card integration-card">
                        <div className="card-header">
                            <div className="integration-title">
                                <div className="icon-box oneroster">
                                    <Database size={24} />
                                </div>
                                <div>
                                    <h3>OneRoster SIS</h3>
                                    <p>Rostering & Enrollment Sync</p>
                                </div>
                            </div>
                            <button className="btn-toggle" onClick={() => toggleIntegration('oneroster')}>
                                {integrations.oneroster.connected ?
                                    <ToggleRight size={32} color="var(--success)" /> :
                                    <ToggleLeft size={32} color="var(--text-muted)" />
                                }
                            </button>
                        </div>

                        <div className="integration-status">
                            <div className="status-row">
                                <span className="label">Status:</span>
                                <span className={`status-badge ${integrations.oneroster.connected ? 'success' : 'neutral'}`}>
                                    {integrations.oneroster.connected ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                    {integrations.oneroster.status}
                                </span>
                            </div>
                            <div className="status-row">
                                <span className="label">Last Sync:</span>
                                <span className="value">{integrations.oneroster.lastSync}</span>
                            </div>
                        </div>

                        <div className="integration-actions">
                            <button className="btn-secondary" disabled={!integrations.oneroster.connected}>
                                <RefreshCw size={16} />
                                Manual Sync
                            </button>
                            <button className="btn-link">Configuration</button>
                        </div>
                    </div>

                    <div className="card integration-card">
                        <div className="card-header">
                            <div className="integration-title">
                                <div className="icon-box google">
                                    <Cloud size={24} />
                                </div>
                                <div>
                                    <h3>Google Drive</h3>
                                    <p>Auto-Archive Reports</p>
                                </div>
                            </div>
                            <button className="btn-toggle" onClick={() => toggleIntegration('google')}>
                                {integrations.google.connected ?
                                    <ToggleRight size={32} color="var(--success)" /> :
                                    <ToggleLeft size={32} color="var(--text-muted)" />
                                }
                            </button>
                        </div>

                        <div className="integration-status">
                            <div className="status-row">
                                <span className="label">Status:</span>
                                <span className={`status-badge ${integrations.google.connected ? 'success' : 'neutral'}`}>
                                    {integrations.google.connected ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                    {integrations.google.status}
                                </span>
                            </div>
                            <div className="status-row">
                                <span className="label">Folder:</span>
                                <span className="value">/Education Walkthrough/2024</span>
                            </div>
                        </div>

                        <div className="integration-actions">
                            <button className="btn-secondary" disabled={!integrations.google.connected}>
                                Change Account
                            </button>
                            <button className="btn-link">Folder Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
