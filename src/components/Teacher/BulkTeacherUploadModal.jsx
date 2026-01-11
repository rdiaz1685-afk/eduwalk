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
        // Basic CSV regex to handle commas inside quotes
        const rowData = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
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

const BulkTeacherUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ total: 0, current: 0 });
    const [schools, setSchools] = useState([]);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);

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

    const tenureMapping = {
        'nuevo': 'new',
        'new': 'new',
        'antigüedad': 'tenured',
        'antiguedad': 'tenured',
        'tenured': 'tenured',
        'base': 'tenured'
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
                const fullName = row['Nombre'] || row['Full Name'] || row['full_name'];
                const campusName = row['Campus'] || row['School'] || '';
                const rawType = (row['Tipo'] || row['Type'] || 'new').toLowerCase().trim();

                if (!fullName) {
                    throw new Error('Nombre del profesor faltante');
                }

                // Map tenure status
                let tenureStatus = 'new';
                if (tenureMapping[rawType]) {
                    tenureStatus = tenureMapping[rawType];
                }

                // Find School ID
                let schoolId = null;
                if (campusName) {
                    const school = schools.find(s =>
                        s.name.toLowerCase().includes(campusName.toLowerCase())
                    );
                    schoolId = school?.id;
                }

                if (!schoolId) {
                    throw new Error(`Campus no encontrado: ${campusName}`);
                }

                // Create Teacher
                const { error: insertError } = await supabase
                    .from('teachers')
                    .insert([{
                        full_name: fullName,
                        school_id: schoolId,
                        tenure_status: tenureStatus
                    }]);

                if (insertError) throw insertError;

                successCount++;
                log.push({ name: fullName, status: 'success' });
            } catch (err) {
                errorCount++;
                log.push({ name: row['Nombre'] || 'Desconocido', status: 'error', message: err.message });
            }

            setProgress(prev => ({ ...prev, current: prev.current + 1 }));

            // Small delay to be safe, though not strictly required for non-auth inserts
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        setResults({ success: successCount, errors: errorCount, log });
        setIsProcessing(false);
        if (onUploadComplete) onUploadComplete();
    };

    const downloadTemplate = () => {
        const csvContent = "Nombre,Campus,Tipo\nJuan Perez,Mitras,Nuevo\nMaria Rodriguez,Cumbres,Antiguedad";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_maestros_eduwalk.csv");
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
                        <h2 style={{ margin: 0 }}>Carga Masiva de Maestros</h2>
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
                                Sube un archivo CSV con las columnas: <strong>Nombre, Campus, Tipo</strong>.
                                <br />Tipos válidos: Nuevo, Antiguedad.
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

                        {!file ? (
                            <div
                                onClick={() => document.getElementById('csvTeacherInput').click()}
                                style={{
                                    border: '2px dashed #e2e8f0', borderRadius: 'var(--radius-lg)',
                                    padding: '3rem 1rem', textAlign: 'center', cursor: 'pointer'
                                }}
                            >
                                <FileText size={48} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
                                <p>Haz clic para seleccionar tu archivo CSV de maestros</p>
                                <input type="file" id="csvTeacherInput" accept=".csv" hidden onChange={handleFileChange} />
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
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Campus</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Tipo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.slice(0, 5).map((row, i) => (
                                                <tr key={i} style={{ borderTop: '1px solid var(--bg-main)' }}>
                                                    <td style={{ padding: '8px' }}>{row['Nombre'] || row['Full Name']}</td>
                                                    <td style={{ padding: '8px' }}>{row['Campus'] || row['School']}</td>
                                                    <td style={{ padding: '8px' }}>{row['Tipo'] || row['Type']}</td>
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
                                    {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Procesando {progress.current}/{progress.total}...</> : 'Importar Maestros'}
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

export default BulkTeacherUploadModal;
