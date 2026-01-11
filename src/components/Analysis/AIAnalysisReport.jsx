import React, { useState } from 'react';
import {
    Brain,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Target,
    BookOpen,
    Users,
    Calendar,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Download
} from 'lucide-react';
import { generateAIAnalysisPDF } from '../../services/pdfService';
import './AIAnalysisReport.css';

const AIAnalysisReport = ({
    analysisData,
    onAcceptPlan,
    onScheduleFollowUp,
    teacherName = 'Docente',
    date = new Date().toLocaleDateString()
}) => {
    const [expandedSections, setExpandedSections] = useState({
        analysis: true,
        actionPlan: true,
        recommendations: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (!analysisData) {
        return (
            <div className="ai-analysis-loading">
                <div className="loading-content">
                    <Brain className="animate-pulse" size={48} />
                    <h3>Análisis de IA en progreso...</h3>
                    <p>Nuestra IA está analizando la observación para generar insights personalizados</p>
                </div>
            </div>
        );
    }

    const { analysis, actionPlan, recommendations } = analysisData;

    const handleDownloadPDF = () => {
        if (!analysisData) return;
        generateAIAnalysisPDF(teacherName, date, analysisData);
    };

    return (
        <div className="ai-analysis-report">
            {/* Header */}
            <div className="analysis-header">
                <div className="header-content">
                    <div className="ai-badge">
                        <Brain size={24} />
                        <span>Análisis con IA</span>
                    </div>
                    <div className="overall-score">
                        <span className="score-label">Puntuación General</span>
                        <span className="score-value">{analysis.overallScore}/4.0</span>
                    </div>
                </div>
            </div>

            {/* Key Findings */}
            <div className="key-findings">
                <h3>Conclusiones Clave</h3>
                <div className="findings-grid">
                    {analysis.keyFindings.map((finding, index) => (
                        <div key={index} className="finding-card">
                            <Lightbulb className="finding-icon" size={20} />
                            <p>{finding}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analysis Section */}
            <div className="analysis-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection('analysis')}
                >
                    <h3>Análisis Detallado</h3>
                    {expandedSections.analysis ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {expandedSections.analysis && (
                    <div className="section-content">
                        {/* Strengths */}
                        <div className="strengths-section">
                            <h4>
                                <CheckCircle className="text-success" size={20} />
                                Fortalezas Identificadas
                            </h4>
                            <div className="strengths-list">
                                {analysis.strengths.map((strength, index) => (
                                    <div key={index} className="strength-card">
                                        <div className="strength-header">
                                            <span className="indicator-title">{strength.indicator}</span>
                                            <span className="score-badge success">{strength.score}/4</span>
                                        </div>
                                        <div className="strength-details">
                                            <span className="domain-tag">{strength.domain}</span>
                                            <p className="rationale">{strength.rationale}</p>
                                            {strength.evidence && (
                                                <div className="evidence">
                                                    <strong>Evidencia:</strong> {strength.evidence}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Areas for Improvement */}
                        <div className="improvements-section">
                            <h4>
                                <AlertTriangle className="text-warning" size={20} />
                                Áreas de Oportunidad
                            </h4>
                            <div className="improvements-list">
                                {analysis.improvements.map((improvement, index) => (
                                    <div key={index} className="improvement-card">
                                        <div className="improvement-header">
                                            <span className="indicator-title">{improvement.indicator}</span>
                                            <div className="improvement-meta">
                                                <span className="score-badge warning">{improvement.score}/4</span>
                                                <span className={`priority-badge ${improvement.priority}`}>
                                                    {improvement.priority === 'high' ? 'Alta' : 'Media'} Prioridad
                                                </span>
                                            </div>
                                        </div>
                                        <div className="improvement-details">
                                            <span className="domain-tag">{improvement.domain}</span>
                                            <p className="impact"><strong>Impacto:</strong> {improvement.impact}</p>
                                            {improvement.evidence && (
                                                <div className="evidence">
                                                    <strong>Evidencia:</strong> {improvement.evidence}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Domain Analysis */}
                        <div className="domain-analysis">
                            <h4>Análisis por Dominios</h4>
                            <div className="domains-grid">
                                {Object.entries(analysis.domainAnalysis).map(([domainId, domainData]) => (
                                    <div key={domainId} className="domain-card">
                                        <h5>{domainData.title}</h5>
                                        <div className="domain-score">
                                            <span className="score-value">{domainData.averageScore}/4</span>
                                            <span className={`status-badge ${domainData.status}`}>
                                                {domainData.status === 'strong' ? 'Fuerte' :
                                                    domainData.status === 'developing' ? 'En Desarrollo' :
                                                        'Necesita Mejora'}
                                            </span>
                                        </div>
                                        <div className="domain-indicators">
                                            {domainData.indicatorCount} indicadores evaluados
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Plan Section */}
            <div className="action-plan-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection('actionPlan')}
                >
                    <h3>
                        <Target size={20} />
                        Plan de Acción Personalizado
                    </h3>
                    {expandedSections.actionPlan ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {expandedSections.actionPlan && (
                    <div className="section-content">
                        <div className="action-plan-intro">
                            <p>Plan de acción estructurado para abordar las áreas de oportunidad identificadas:</p>
                        </div>

                        {actionPlan.map((action, index) => (
                            <div key={action.id} className="action-item">
                                <div className="action-header">
                                    <h4>{action.area}</h4>
                                    <div className="action-meta">
                                        <span className="current-score">Actual: {action.currentScore}/4</span>
                                        <TrendingUp className="target-icon" size={16} />
                                        <span className="target-score">Meta: {action.targetScore}/4</span>
                                    </div>
                                </div>

                                <div className="action-content">
                                    <div className="strategies">
                                        <h5>
                                            <BookOpen size={16} />
                                            Estrategias Recomendadas
                                        </h5>
                                        <ul>
                                            {action.strategies.map((strategy, idx) => (
                                                <li key={idx}>{strategy}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="timeline">
                                        <h5>
                                            <Clock size={16} />
                                            Cronograma
                                        </h5>
                                        <div className="timeline-grid">
                                            <div className="timeline-item">
                                                <span className="timeline-label">Inmediato:</span>
                                                <span className="timeline-value">{action.timeline.immediate}</span>
                                            </div>
                                            <div className="timeline-item">
                                                <span className="timeline-label">Corto plazo:</span>
                                                <span className="timeline-value">{action.timeline.short}</span>
                                            </div>
                                            <div className="timeline-item">
                                                <span className="timeline-label">Mediano plazo:</span>
                                                <span className="timeline-value">{action.timeline.medium}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="resources">
                                        <h5>
                                            <Users size={16} />
                                            Recursos de Apoyo
                                        </h5>
                                        <ul>
                                            {action.resources.map((resource, idx) => (
                                                <li key={idx}>{resource}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="success-criteria">
                                        <h5>Criterios de Éxito</h5>
                                        <ul>
                                            {action.successCriteria.map((criteria, idx) => (
                                                <li key={idx}>{criteria}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recommendations Section */}
            <div className="recommendations-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection('recommendations')}
                >
                    <h3>
                        <Lightbulb size={20} />
                        Recomendaciones Adicionales
                    </h3>
                    {expandedSections.recommendations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {expandedSections.recommendations && (
                    <div className="section-content">
                        <div className="recommendations-grid">
                            <div className="recommendation-category">
                                <h4>
                                    <AlertTriangle size={16} />
                                    Acciones Inmediatas
                                </h4>
                                <ul>
                                    {recommendations.immediate.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="recommendation-category">
                                <h4>
                                    <Calendar size={16} />
                                    Corto Plazo (1-3 meses)
                                </h4>
                                <ul>
                                    {recommendations.shortTerm.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="recommendation-category">
                                <h4>
                                    <Target size={16} />
                                    Largo Plazo (3+ meses)
                                </h4>
                                <ul>
                                    {recommendations.longTerm.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="analysis-actions" style={{ gap: '10px' }}>
                <button
                    className="btn btn-primary"
                    onClick={() => onAcceptPlan && onAcceptPlan(actionPlan)}
                >
                    <CheckCircle size={18} />
                    Aceptar Plan
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => onScheduleFollowUp && onScheduleFollowUp()}
                >
                    <Calendar size={18} />
                    Seguimiento
                </button>
                <button
                    className="btn btn-outline"
                    onClick={handleDownloadPDF}
                    style={{
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Download size={18} />
                    Descargar PDF
                </button>
            </div>
        </div>
    );
};

export default AIAnalysisReport;
