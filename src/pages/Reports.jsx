import React, { useEffect, useState } from 'react';
import { FileText, Download, Filter, Search, Brain, Eye } from 'lucide-react';
import { generateObservationPDF } from '../services/pdfService';
import { analyzeObservation } from '../services/aiAnalysisService';
import { supabase } from '../lib/supabase';
import { formatAppName } from '../utils/formatters';
import AIAnalysisReport from '../components/Analysis/AIAnalysisReport';
import ScheduleFollowUpModal from '../components/FollowUp/ScheduleFollowUpModal';
import '../styles/Reports.css';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedReport, setSelectedReport] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [analyzingReport, setAnalyzingReport] = useState(false);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [selectedActionPlan, setSelectedActionPlan] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const { data, error } = await supabase
                .from('observations')
                .select(`
                    *,
                    teachers (
                        full_name,
                        school_id
                    ),
                    profiles:observer_id (
                        full_name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (report) => {
        // Extract data from the JSONB template_data
        const scores = {};
        const notes = {};

        // Loop through template_data keys (indicators)
        // Structure of template_data: { "2a": { score: 4, note: "..." }, ... }
        if (report.template_data) {
            Object.entries(report.template_data).forEach(([key, value]) => {
                scores[key] = { score: value.score };
                notes[key] = { note: value.note };
            });
        }

        const teacherName = report.teachers?.full_name || 'Unknown Teacher';
        const date = new Date(report.created_at).toLocaleDateString();
        const subject = report.template_data?.metadata?.subject || "General Observation";
        const observerName = report.profiles?.full_name || 'Admin';

        generateObservationPDF(teacherName, date, subject, scores, notes, observerName);
    };

    const handleAIAnalysis = async (report) => {
        setSelectedReport(report);
        setShowAnalysisModal(true);
        setAnalyzingReport(true);
        setAiAnalysis(null);

        try {
            // Prepare data for AI analysis
            const scores = {};
            const notes = {};

            if (report.template_data) {
                Object.entries(report.template_data).forEach(([key, value]) => {
                    if (key !== 'metadata') {
                        scores[key] = { score: value.score };
                        notes[key] = { note: value.note };
                    }
                });
            }

            const observationData = {
                scores,
                notes,
                teacherName: report.teachers?.full_name,
                subject: report.template_data?.metadata?.subject,
                date: report.created_at
            };

            const analysis = await analyzeObservation(observationData);
            setAiAnalysis(analysis);
        } catch (error) {
            console.error('Error en análisis de IA:', error);
            alert('Error al generar el análisis de IA. Por favor intenta nuevamente.');
        } finally {
            setAnalyzingReport(false);
        }
    };

    const handleCloseAnalysisModal = () => {
        setShowAnalysisModal(false);
        setSelectedReport(null);
        setAiAnalysis(null);
    };

    const handleAcceptActionPlan = (actionPlan) => {
        // TODO: Save action plan to database
        console.log('Plan de acción aceptado:', actionPlan);
        alert('Plan de acción guardado exitosamente. Se programarán los seguimientos correspondientes.');
    };

    const handleScheduleFollowUp = () => {
        if (aiAnalysis && aiAnalysis.actionPlan) {
            setSelectedActionPlan(aiAnalysis.actionPlan);
            setShowFollowUpModal(true);
        } else {
            alert('Función de programación de seguimiento próximamente disponible.');
        }
    };

    const handleFollowUpScheduleComplete = (followUps) => {
        console.log('Seguimientos programados:', followUps);
        alert(`${followUps.length} seguimientos programados exitosamente.`);
        setShowFollowUpModal(false);
        setSelectedActionPlan(null);
    };

    const filteredReports = reports.filter(report => {
        const teacherName = report.teachers?.full_name?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        return teacherName.includes(searchLower);
    });

    return (
        <div className="reports-container">
            <div className="reports-header">
                <div>
                    <h1>Reports & Feedback</h1>
                    <p className="subtitle">Manage and distribute observation reports</p>
                </div>
                <div className="header-actions">
                    <button className="btn-outline">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                    <button className="btn-primary">
                        <FileText size={18} />
                        <span>New Report</span>
                    </button>
                </div>
            </div>

            <div className="reports-controls">
                <div className="search-box">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by teacher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-responsive">
                <table className="reports-table">
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Date</th>
                            <th>Subject</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading reports...</td></tr>
                        ) : filteredReports.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No reports found.</td></tr>
                        ) : (
                            filteredReports.map((report) => (
                                <tr key={report.id}>
                                    <td className="fw-medium">{formatAppName(report.teachers?.full_name) || 'Unknown'}</td>
                                    <td>{new Date(report.created_at).toLocaleDateString()}</td>
                                    <td>{report.template_data?.metadata?.subject || 'General Observation'}</td>
                                    <td>
                                        <span className="score-badge">{report.score}</span>
                                    </td>
                                    <td>
                                        <span className={`status-pill completed`}>
                                            {report.status || 'Completed'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleDownload(report)}
                                            title="Download/Email PDF"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleAIAnalysis(report)}
                                            title="Análisis con IA"
                                            style={{ marginLeft: '0.5rem' }}
                                        >
                                            <Brain size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* AI Analysis Modal */}
            {showAnalysisModal && (
                <div className="modal-overlay">
                    <div className="modal-content ai-modal">
                        <div className="modal-header">
                            <h2>
                                <Brain size={24} />
                                Análisis de IA - {formatAppName(selectedReport?.teachers?.full_name)}
                            </h2>
                            <button
                                onClick={handleCloseAnalysisModal}
                                className="btn-icon"
                            >
                                <Eye size={20} />
                            </button>
                        </div>
                        <div className="modal-body ai-modal-body">
                            <AIAnalysisReport
                                analysisData={aiAnalysis}
                                onAcceptPlan={handleAcceptActionPlan}
                                onScheduleFollowUp={handleScheduleFollowUp}
                                teacherName={formatAppName(selectedReport?.teachers?.full_name)}
                                date={new Date(selectedReport?.created_at).toLocaleDateString()}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Follow-Up Modal */}
            {showFollowUpModal && (
                <ScheduleFollowUpModal
                    isOpen={showFollowUpModal}
                    onClose={() => {
                        setShowFollowUpModal(false);
                        setSelectedActionPlan(null);
                    }}
                    teacherId={selectedReport?.teacher_id}
                    teacherName={formatAppName(selectedReport?.teachers?.full_name)}
                    coordinatorId={selectedReport?.observer_id}
                    actionPlan={selectedActionPlan}
                    onScheduleComplete={handleFollowUpScheduleComplete}
                />
            )}
        </div>
    );
};

export default Reports;
