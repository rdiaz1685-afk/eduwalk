import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    ChevronRight,
    ArrowLeft,
    Save,
    WifiOff,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { templates, danielsonFramework } from '../data/templates';
import { generateObservationPDF } from '../services/pdfService';
import { supabase } from '../lib/supabase';
import '../styles/Observations.css';

const Observations = () => {
    const location = useLocation();
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [observationData, setObservationData] = useState({});

    // Safety Check: Initialize activeDomain only if framework and domains exist
    const [activeDomain, setActiveDomain] = useState(() => {
        if (danielsonFramework && danielsonFramework.domains && danielsonFramework.domains.length > 0) {
            return danielsonFramework.domains[0].id;
        }
        return '';
    });

    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddingTeacher, setIsAddingTeacher] = useState(false);
    const [newTeacherName, setNewTeacherName] = useState('');
    const [selectedTeacherId, setSelectedTeacherId] = useState(location.state?.teacherId || '');
    const [subject, setSubject] = useState('');

    useEffect(() => {
        fetchTeachers();

        // If teacherId is passed in state, we might want to automatically scroll or focus
        if (location.state?.teacherId) {
            setSelectedTeacherId(location.state.teacherId);
        }
    }, [location.state]);

    const fetchTeachers = async () => {
        try {
            if (!supabase) {
                console.warn("Supabase client not initialized, skipping fetch.");
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            let query = supabase.from('teachers').select('*');

            // If user is a coordinator, only show their assigned teachers
            if (profile?.role === 'coordinator') {
                query = query.eq('coordinator_id', user.id);
            }

            const { data, error } = await query.order('full_name');

            if (error) {
                console.warn('Supabase fetch error (expected if table empty):', error.message);
            } else {
                setTeachers(data || []);
            }
        } catch (err) {
            console.error('Error fetching teachers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeacher = async () => {
        if (!newTeacherName.trim()) return;
        const previousLoading = loading;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('teachers')
                .insert([{ full_name: newTeacherName }])
                .select();

            if (error) throw error;

            await fetchTeachers();
            setIsAddingTeacher(false);
            setNewTeacherName('');
        } catch (err) {
            console.error('Error adding teacher:', err);
            alert('Could not add teacher: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartObservation = (template) => {
        setActiveTemplate(template);
    };

    const handleScore = (indicatorId, score) => {
        setObservationData(prev => ({
            ...prev,
            [indicatorId]: { ...prev[indicatorId], score }
        }));
    };

    const handleNote = (indicatorId, note) => {
        setObservationData(prev => ({
            ...prev,
            [indicatorId]: { ...prev[indicatorId], note }
        }));
    };

    const handleFinalizeReport = async () => {
        if (!selectedTeacherId) {
            alert('Please select a teacher first.');
            return;
        }

        setLoading(true);
        try {
            // Calculate average score
            const scores = Object.values(observationData).map(d => d.score).filter(s => s > 0);
            const averageScore = scores.length > 0
                ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                : 0;

            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            const observerName = profile?.full_name || 'Admin';

            const payload = {
                teacher_id: selectedTeacherId,
                observer_id: user.id,
                template_data: {
                    ...observationData,
                    metadata: { subject }
                },
                score: averageScore,
                status: 'completed'
            };

            const { error } = await supabase
                .from('observations')
                .insert([payload]);

            if (error) throw error;

            // Generate PDF logic
            const teacher = teachers.find(t => t.id === selectedTeacherId);
            const teacherName = teacher ? teacher.full_name : 'Teacher';
            generateObservationPDF(
                teacherName,
                new Date().toLocaleDateString(),
                subject || "General Observation",
                observationData,
                observationData,
                observerName
            );

            alert('Observation Saved to Database & PDF Generated!');
            setObservationData({});
            setActiveTemplate(null);
            setSelectedTeacherId('');

        } catch (err) {
            console.error('Error saving observation:', err);
            alert('Error saving to database: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER SAFEGUARDS ---
    if (!templates) return <div className="p-4">Error: Templates data missing.</div>;

    if (!activeTemplate) {
        return (
            <div className="observations-container">
                <header className="page-header">
                    <div>
                        <h1>Start New Observation</h1>
                        <p className="subtitle">Select a framework to begin</p>
                    </div>
                    <div className={`offline-badge ${navigator.onLine ? 'online' : 'offline'}`}>
                        {navigator.onLine ? <CheckCircle2 size={16} /> : <WifiOff size={16} />}
                        <span>{navigator.onLine ? 'Online' : 'Offline Mode'}</span>
                    </div>
                </header>

                <div className="templates-grid">
                    {templates.map(template => (
                        <button
                            key={template.id}
                            className="template-card"
                            onClick={() => handleStartObservation(template)}
                        >
                            <div className="template-icon">
                                {template.name.charAt(0)}
                            </div>
                            <div className="template-info">
                                <h3>{template.name}</h3>
                                <span className="template-meta">{template.items} Indicators • {template.type}</span>
                            </div>
                            <ChevronRight className="chevron" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Active Observation Mode
    return (
        <div className="observation-workspace">
            <header className="workspace-header">
                <button className="btn-back" onClick={() => setActiveTemplate(null)}>
                    <ArrowLeft size={20} />
                    <span>Exit</span>
                </button>
                <div className="header-meta">
                    <h2>{activeTemplate.name}</h2>
                    <span className="unsaved-status">Changes saved locally</span>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleFinalizeReport}
                >
                    <Save size={18} style={{ marginRight: '8px' }} />
                    Finalize Report
                </button>
            </header>

            <div className="form-layout">
                {danielsonFramework?.domains && (
                    <aside className="domain-nav">
                        {danielsonFramework.domains.map(domain => (
                            <button
                                key={domain.id}
                                className={`domain-link ${activeDomain === domain.id ? 'active' : ''}`}
                                onClick={() => setActiveDomain(domain.id)}
                            >
                                <div className="status-dot"></div>
                                <span>{domain.title}</span>
                            </button>
                        ))}
                    </aside>
                )}

                <main className="form-content">
                    <div className="teacher-info-card">
                        <div className="input-group">
                            <label>Teacher</label>
                            {loading && !teachers.length ? (
                                <p>Loading Teachers...</p>
                            ) : isAddingTeacher ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter Full Name"
                                        className="premium-input"
                                        value={newTeacherName}
                                        onChange={(e) => setNewTeacherName(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        className="rating-btn selected"
                                        onClick={handleAddTeacher}
                                        style={{ padding: '0 1rem', fontSize: '0.9rem' }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="rating-btn"
                                        onClick={() => setIsAddingTeacher(false)}
                                        style={{ padding: '0 1rem', fontSize: '0.9rem' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        className="premium-input"
                                        style={{ flex: 1 }}
                                        value={selectedTeacherId}
                                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    >
                                        <option value="">Select Teacher...</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.full_name}</option>
                                        ))}
                                    </select>
                                    <button
                                        className="rating-btn"
                                        onClick={() => setIsAddingTeacher(true)}
                                        title="Quick Add Teacher"
                                        style={{ padding: '0 1rem', fontSize: '1.2rem', fontWeight: 'bold' }}
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="input-group">
                            <label>Subject/Grade</label>
                            <input
                                type="text"
                                placeholder="e.g. Math 101"
                                className="premium-input"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="domain-section">
                        {danielsonFramework?.domains && danielsonFramework.domains
                            .filter(d => d.id === activeDomain)
                            .map(domain => (
                                <div key={domain.id} className="domain-container">
                                    <div className="domain-header">
                                        <h3>{domain.title}</h3>
                                        <p>Evaluate the detailed indicators below.</p>
                                    </div>

                                    <div className="indicators-list">
                                        {domain.indicators && domain.indicators.map(indicator => (
                                            <div key={indicator.id} className="indicator-card">
                                                <div className="indicator-header">
                                                    <span className="indicator-code">{indicator.id}</span>
                                                    <div>
                                                        <h4>{indicator.title}</h4>
                                                        <p>{indicator.description}</p>
                                                    </div>
                                                </div>

                                                <div className="scoring-row">
                                                    <div className="rating-scale">
                                                        {[1, 2, 3, 4].map(score => (
                                                            <button
                                                                key={score}
                                                                className={`rating-btn ${observationData[indicator.id]?.score === score ? 'selected' : ''}`}
                                                                onClick={() => handleScore(indicator.id, score)}
                                                            >
                                                                {score}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <textarea
                                                        placeholder="Add evidence notes..."
                                                        className="evidence-input"
                                                        value={observationData[indicator.id]?.note || ''}
                                                        onChange={(e) => handleNote(indicator.id, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Observations;
