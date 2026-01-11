import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Target, CheckCircle } from 'lucide-react';
import { WeekService } from '../../services/weekService';
import { supabase } from '../../lib/supabase';
import './ScheduleFollowUpModal.css';

const ScheduleFollowUpModal = ({
    isOpen,
    onClose,
    teacherId,
    teacherName,
    coordinatorId,
    actionPlan,
    onScheduleComplete
}) => {
    const [scheduleType, setScheduleType] = useState('weekly'); // weekly or fortnightly
    const [selectedWeeks, setSelectedWeeks] = useState([]);
    const [selectedFortnights, setSelectedFortnights] = useState([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [availableWeeks, setAvailableWeeks] = useState([]);
    const [availableFortnights, setAvailableFortnights] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const weeks = WeekService.getUpcomingWeeks(8);
            const fortnights = WeekService.getUpcomingFortnights(4);
            setAvailableWeeks(weeks);
            setAvailableFortnights(fortnights);

            // Seleccionar la próxima semana por defecto (índice 1 de las próximas)
            if (weeks.length > 1) {
                setSelectedWeeks([weeks[1].number]);
            }
        }
    }, [isOpen]);

    const handleWeekToggle = (weekNumber) => {
        setSelectedWeeks(prev =>
            prev.includes(weekNumber)
                ? prev.filter(w => w !== weekNumber)
                : [...prev, weekNumber]
        );
    };

    const handleFortnightToggle = (fortnightNumber) => {
        setSelectedFortnights(prev =>
            prev.includes(fortnightNumber)
                ? prev.filter(f => f !== fortnightNumber)
                : [...prev, fortnightNumber]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const followUps = [];
            const now = new Date();

            if (scheduleType === 'weekly') {
                selectedWeeks.forEach(weekNumber => {
                    const weekRange = WeekService.getWeekDateRange(weekNumber);
                    followUps.push({
                        teacher_id: teacherId,
                        coordinator_id: coordinatorId,
                        type: 'weekly',
                        week_number: weekNumber,
                        scheduled_date: weekRange.start.toISOString(),
                        end_date: weekRange.end.toISOString(),
                        notes: notes,
                        action_plan: actionPlan,
                        status: 'scheduled',
                        created_at: now.toISOString()
                    });
                });
            } else {
                selectedFortnights.forEach(fortnightNumber => {
                    const fortnightRange = WeekService.getFortnightDateRange(fortnightNumber);
                    followUps.push({
                        teacher_id: teacherId,
                        coordinator_id: coordinatorId,
                        type: 'fortnightly',
                        fortnight_number: fortnightNumber,
                        scheduled_date: fortnightRange.start.toISOString(),
                        end_date: fortnightRange.end.toISOString(),
                        notes: notes,
                        action_plan: actionPlan,
                        status: 'scheduled',
                        created_at: now.toISOString()
                    });
                });
            }

            // Insertar seguimientos en la base de datos
            const { error } = await supabase
                .from('follow_ups')
                .insert(followUps);

            if (error) throw error;

            // Actualizar el plan de acción con los seguimientos programados
            if (actionPlan) {
                await supabase
                    .from('teacher_action_plans')
                    .upsert({
                        teacher_id: teacherId,
                        coordinator_id: coordinatorId,
                        plan_data: actionPlan,
                        follow_ups_scheduled: followUps.length,
                        updated_at: now.toISOString()
                    });
            }

            onScheduleComplete && onScheduleComplete(followUps);
            onClose();

        } catch (error) {
            console.error('Error scheduling follow-ups:', error);
            alert('Error al programar seguimientos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content follow-up-modal">
                <div className="modal-header">
                    <h2>
                        <Calendar size={24} />
                        Programar Seguimiento - {teacherName}
                    </h2>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="follow-up-form">
                    <div className="form-section">
                        <h3>
                            <Clock size={20} />
                            Tipo de Seguimiento
                        </h3>
                        <div className="schedule-type-selector">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="scheduleType"
                                    value="weekly"
                                    checked={scheduleType === 'weekly'}
                                    onChange={(e) => setScheduleType(e.target.value)}
                                />
                                <div className="radio-content">
                                    <span className="radio-title">Semanal</span>
                                    <span className="radio-description">Seguimiento cada semana</span>
                                </div>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="scheduleType"
                                    value="fortnightly"
                                    checked={scheduleType === 'fortnightly'}
                                    onChange={(e) => setScheduleType(e.target.value)}
                                />
                                <div className="radio-content">
                                    <span className="radio-title">Quincenal</span>
                                    <span className="radio-description">Seguimiento cada dos semanas</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>
                            <Calendar size={20} />
                            Seleccionar {scheduleType === 'weekly' ? 'Semanas' : 'Quincenas'}
                        </h3>

                        {scheduleType === 'weekly' ? (
                            <div className="weeks-grid">
                                {availableWeeks.map((week) => (
                                    <label key={week.number} className="week-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedWeeks.includes(week.number)}
                                            onChange={() => handleWeekToggle(week.number)}
                                        />
                                        <div className="week-card">
                                            <div className="week-header">
                                                <span className="week-number">{week.label}</span>
                                                {week.number === WeekService.getCurrentWeek() && (
                                                    <span className="current-badge">Actual</span>
                                                )}
                                            </div>
                                            <div className="week-dates">{week.display}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="fortnights-grid">
                                {availableFortnights.map((fortnight) => (
                                    <label key={fortnight.number} className="fortnight-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedFortnights.includes(fortnight.number)}
                                            onChange={() => handleFortnightToggle(fortnight.number)}
                                        />
                                        <div className="fortnight-card">
                                            <div className="fortnight-header">
                                                <span className="fortnight-number">{fortnight.label}</span>
                                                {fortnight.number === WeekService.getCurrentFortnight() && (
                                                    <span className="current-badge">Actual</span>
                                                )}
                                            </div>
                                            <div className="fortnight-dates">{fortnight.display}</div>
                                            <div className="fortnight-weeks">
                                                Semanas {fortnight.weeks.join(' y ')}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-section">
                        <h3>
                            <Users size={20} />
                            Notas Adicionales
                        </h3>
                        <textarea
                            className="notes-textarea"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Agregar notas específicas para los seguimientos programados..."
                            rows={4}
                        />
                    </div>

                    {actionPlan && (
                        <div className="form-section">
                            <h3>
                                <Target size={20} />
                                Plan de Acción Asociado
                            </h3>
                            <div className="action-plan-summary">
                                <div className="plan-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Áreas de mejora:</span>
                                        <span className="stat-value">{actionPlan.length}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Seguimientos:</span>
                                        <span className="stat-value">
                                            {scheduleType === 'weekly' ? selectedWeeks.length : selectedFortnights.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || (selectedWeeks.length === 0 && selectedFortnights.length === 0)}
                        >
                            {loading ? (
                                <>
                                    <Clock className="animate-spin" size={18} />
                                    Programando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Programar Seguimientos
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleFollowUpModal;
