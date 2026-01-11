import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle, AlertTriangle, Loader2, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Helper for simple CSV parsing without external lib
const parseCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];

    // Simple header extraction
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        // Basic CSV regex to handle commas inside quotes, allowing spaces in unquoted fields
        const rowData = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        // Fallback split if regex fails or simple structure
        const values = rowData || lines[i].split(',').map(v => v.trim());

        if (values.length > 0) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
            });
            data.push(row);
        }
    }
    return data;
};

const BulkUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ total: 0, current: 0 });
    const [schools, setSchools] = useState([]);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [sendEmails, setSendEmails] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSchools();
            resetState();
        }
    }, [isOpen]);

    const resetState = () => {
        setFile(null);
        setPreview([]);
        setIsProcessing(false);
        setProgress({ total: 0, current: 0 });
        setError(null);
        setResults(null);
        setSendEmails(false);
    };

    const fetchSchools = async () => {
        const { data } = await supabase.from('schools').select('*');
        setSchools(data || []);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const parsedData = parseCSV(evt.target.result);
                    setPreview(parsedData);
                } catch (err) {
                    setError('Error al leer el archivo CSV: ' + err.message);
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const roleMapping = {
        'coordinador': 'coordinator',
        'supervisor': 'supervisor',
        'director de campus': 'director',
        'director': 'director',
        'rector': 'rector',
        'administrador': 'admin',
        'admin': 'admin'
    };

    const processUpload = async () => {
        if (preview.length === 0) return;

        setIsProcessing(true);
        setProgress({ total: preview.length, current: 0 });

        let successCount = 0;
        let errorCount = 0;
        const log = [];

        for (const row of preview) {
            try {
                const fullName = (row['Nombre'] || row['Nombre completo'] || row['full_name'] || '').trim();
                const email = (row['Correo'] || row['email'] || row['Email'] || '').trim();
                const rawRole = (row['Rol'] || row['role'] || '').toLowerCase().trim();
                const campusName = (row['Campus'] || row['school'] || '').trim();

                if (!fullName || !email) {
                    throw new Error('Nombre o Correo faltante');
                }

                // Normalize role string to handle typos and standard variations
                const normalizedRole = rawRole.trim();
                let dbRole = 'coordinator'; // Default

                if (normalizedRole.includes('admin') || normalizedRole.includes('rector')) dbRole = 'rector'; // Map admin/rector to rector for safety or admin if intended
                else if (normalizedRole.includes('director')) dbRole = 'director';
                else if (normalizedRole.includes('supervisor')) dbRole = 'supervisor';
                else if (normalizedRole.includes('coordinador') || normalizedRole.includes('coordiandor')) dbRole = 'coordinator'; // Handle typo

                // Explicit overrides based on map if key exists directly
                if (roleMapping[normalizedRole]) dbRole = roleMapping[normalizedRole];
                const isUniversal = ['admin', 'rector', 'supervisor'].includes(dbRole);

                let schoolId = null;
                if (!isUniversal && campusName) {
                    const school = schools.find(s =>
                        s.name.toLowerCase().includes(campusName.toLowerCase())
                    );
                    schoolId = school?.id || null;
                }

                // Create Auth User
                // Use a fixed password for testing/manual distribution if emails are disabled
                const tempPassword = 'Temporal2025!';
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: email,
                    password: tempPassword,
                });

                if (authError) throw authError;

                // Update Profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: fullName,
                        role: dbRole,
                        school_id: schoolId,
                        email: email, // ensure our new column is filled
                        status: 'Active'
                    })
                    .eq('id', authData.user.id);

                if (profileError) throw profileError;



                // Send Reset Email only if enabled
                if (sendEmails) {
                    await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`
                    });
                }

                successCount++;
                log.push({ name: fullName, status: 'success' });
            } catch (err) {
                errorCount++;
                log.push({ name: row['Nombre'] || 'Desconocido', status: 'error', message: err.message });
            }

            setProgress(prev => ({ ...prev, current: prev.current + 1 }));

            // Add a meaningful delay to avoid Supabase rate limits (spam protection)
            // 3.5 seconds is safer for batch creation
            await new Promise(resolve => setTimeout(resolve, 3500));
        }

        setResults({ success: successCount, errors: errorCount, log });
        setIsProcessing(false);
        if (onUploadComplete) onUploadComplete();
    };

    const downloadTemplate = () => {
        const csvContent = "Nombre,Correo,Rol,Campus\nJuan Perez,juan@ejemplo.com,Coordinador,Mitras\nMaria Garcia,maria@ejemplo.com,Director de Campus,Cumbres";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_carga_masiva_eduwalk.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
            <div className="modal-content" style={{
                background: 'var(--bg-card)', padding: '2rem',
                borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '600px',
                maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--bg-main)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Upload size={24} color="var(--primary)" />
                        <h2 style={{ margin: 0 }}>Carga Masiva de Usuarios</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                {!results ? (
                    <>
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Instrucciones del Formato</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                Sube un archivo CSV con las columnas: <strong>Nombre, Correo, Rol, Campus</strong>.
                                <br />Roles válidos: Coordinador, Director de Campus, Rector, Supervisor.
                            </p>
                            <button
                                onClick={downloadTemplate}
                                style={{
                                    marginTop: '10px', background: 'none', border: '1px solid var(--primary)',
                                    color: 'var(--primary)', padding: '4px 12px', borderRadius: '4px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'
                                }}
                            >
                                <Download size={14} /> Descargar Plantilla
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                            <input
                                type="checkbox"
                                id="sendEmails"
                                checked={sendEmails}
                                onChange={(e) => setSendEmails(e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <label htmlFor="sendEmails" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                                Enviar correos de invitación y contraseña <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(Desmarcar para modo silencioso/prueba)</span>
                            </label>
                        </div>

                        {!file ? (
                            <div
                                onClick={() => document.getElementById('csvInput').click()}
                                style={{
                                    border: '2px dashed #e2e8f0', borderRadius: 'var(--radius-lg)',
                                    padding: '3rem 1rem', textAlign: 'center', cursor: 'pointer'
                                }}
                            >
                                <FileText size={48} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
                                <p>Haz clic para seleccionar tu archivo CSV exportado</p>
                                <input type="file" id="csvInput" accept=".csv" hidden onChange={handleFileChange} />
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 600 }}>Vista previa ({preview.length} registros)</span>
                                    <button onClick={() => setFile(null)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Cambiar archivo</button>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-main)' }}>
                                            <tr>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Nombre</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Correo</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Rol</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.slice(0, 5).map((row, i) => (
                                                <tr key={i} style={{ borderTop: '1px solid var(--bg-main)' }}>
                                                    <td style={{ padding: '8px' }}>{row['Nombre'] || row['Nombre completo'] || row['full_name']}</td>
                                                    <td style={{ padding: '8px' }}>{row['Correo'] || row['email']}</td>
                                                    <td style={{ padding: '8px' }}>{row['Rol'] || row['role']}</td>
                                                </tr>
                                            ))}
                                            {preview.length > 5 && (
                                                <tr><td colSpan="3" style={{ padding: '8px', textAlign: 'center', color: 'var(--text-muted)' }}>... y {preview.length - 5} más</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <button
                                    onClick={processUpload}
                                    disabled={isProcessing}
                                    className="btn-primary"
                                    style={{ width: '100%', marginTop: '1.5rem', py: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                >
                                    {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Creando usuarios lentamente para evitar errores... ({progress.current}/{progress.total})</> : 'Confirmar y Crear Cuentas'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            {results.errors === 0 ? (
                                <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto' }} />
                            ) : (
                                <AlertTriangle size={64} color="#f59e0b" style={{ margin: '0 auto' }} />
                            )}
                        </div>
                        <h3>Proceso Finalizado</h3>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{results.success}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Exitosos</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{results.errors}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Errores</div>
                            </div>
                        </div>

                        {results.errors > 0 && (
                            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Detalle de Errores:</h4>
                                <div style={{
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    background: '#fee2e2',
                                    border: '1px solid #ef4444',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem'
                                }}>
                                    {results.log.filter(l => l.status === 'error').map((l, i) => (
                                        <div key={i} style={{ fontSize: '0.85rem', marginBottom: '4px', paddingBottom: '4px', borderBottom: '1px solid #fecaca' }}>
                                            <strong>{l.name}:</strong> {l.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkUploadModal;
