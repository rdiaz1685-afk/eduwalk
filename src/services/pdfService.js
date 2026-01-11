import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { danielsonFramework } from '../data/templates';

export const generateObservationPDF = (teacherName, date, subject, scores, notes, observerName = 'District Admin') => {
    const doc = new jsPDF();

    // Apply plugin to ensure it's loaded
    // autoTable(doc); // Initialize if needed, but usually just importing it attaches to prototype

    const themeColor = [79, 70, 229]; // Indigo 600

    // Header
    doc.setFillColor(...themeColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Education Walkthrough', 20, 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Observation Report', 20, 30);

    // Metadata Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(15, 50, 180, 35, 3, 3, 'FD');

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    doc.text('Teacher:', 25, 65);
    doc.text('Date:', 110, 65);
    doc.text('Subject/Grade:', 25, 75);
    doc.text('Observer:', 110, 75);

    doc.setFont('helvetica', 'normal');
    doc.text(teacherName || 'N/A', 55, 65);
    doc.text(date || new Date().toLocaleDateString(), 140, 65);
    doc.text(subject || 'N/A', 65, 75);
    doc.text(observerName, 140, 75);

    // Content Table
    const tableRows = [];

    // Safety check for danielsonFramework
    if (danielsonFramework && danielsonFramework.domains) {
        danielsonFramework.domains.forEach(domain => {
            domain.indicators.forEach(ind => {
                const score = scores[ind.id]?.score || '-';
                const note = notes[ind.id]?.note || '';

                tableRows.push([
                    `${ind.id}: ${ind.title}`,
                    score,
                    note
                ]);
            });
        });
    }

    // Use autoTable explicitly
    autoTable(doc, {
        startY: 100,
        head: [['Indicator', 'Score', 'Evidence / Notes']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: themeColor, textColor: 255 },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 'auto' }
        },
        styles: { overflow: 'linebreak', cellPadding: 3 },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('Education Walkthrough Platform', 200, 290, { align: 'right' });
    }

    doc.save(`Observation_${teacherName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateAIAnalysisPDF = (teacherName, date, analysisData) => {
    const doc = new jsPDF();
    const themeColor = [79, 70, 229]; // Indigo 600
    const accentColor = [220, 38, 38]; // Red 600 for improvements

    // Header
    doc.setFillColor(...themeColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Análisis IA y Plan de Acción', 20, 20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Docente: ${teacherName} | Fecha: ${date}`, 20, 30);

    let yPos = 50;

    // 1. Conclusiones Clave
    doc.setTextColor(...themeColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Conclusiones Clave', 20, yPos);
    yPos += 10;

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    analysisData.analysis.keyFindings.forEach(finding => {
        const textLines = doc.splitTextToSize(`• ${finding}`, 170);
        doc.text(textLines, 20, yPos);
        yPos += (textLines.length * 6) + 2;
    });

    yPos += 5;

    // 2. Fortalezas
    doc.setTextColor(22, 101, 52); // Green 800
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Fortalezas Identificadas', 20, yPos);
    yPos += 10;

    const strengthsTable = analysisData.analysis.strengths.map(s => [
        s.indicator,
        `${s.score}/4`,
        s.rationale
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Indicador', 'Punt.', 'Análisis']],
        body: strengthsTable,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 15 }, 2: { cellWidth: 'auto' } },
        margin: { left: 20, right: 20 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // 3. Áreas de Oportunidad
    doc.setTextColor(180, 83, 9); // Amber 800
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Áreas de Oportunidad', 20, yPos);
    yPos += 10;

    const improvementsTable = analysisData.analysis.improvements.map(i => [
        i.indicator,
        `${i.score}/4`,
        i.priority.toUpperCase(),
        i.impact
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Indicador', 'Punt.', 'Prioridad', 'Impacto']],
        body: improvementsTable,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 15 }, 2: { cellWidth: 25 }, 3: { cellWidth: 'auto' } },
        margin: { left: 20, right: 20 }
    });

    doc.addPage();
    yPos = 20;

    // 4. Plan de Acción
    doc.setTextColor(...themeColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Plan de Acción Detallado', 20, yPos);
    yPos += 10;

    analysisData.actionPlan.forEach((plan, index) => {
        if (yPos > 240) { doc.addPage(); yPos = 20; }

        doc.setFillColor(243, 244, 246);
        doc.rect(15, yPos, 180, 8, 'F');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. Área: ${plan.area}`, 20, yPos + 6);
        yPos += 15;

        doc.setFontSize(10);
        doc.text('Estrategias:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 6;
        plan.strategies.forEach(s => {
            const lines = doc.splitTextToSize(`- ${s}`, 160);
            doc.text(lines, 25, yPos);
            yPos += lines.length * 5;
        });

        yPos += 4;
        doc.setFont('helvetica', 'bold');
        doc.text('Cronograma:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`Inmediato: ${plan.timeline.immediate} | Corto: ${plan.timeline.short}`, 25, yPos + 6);
        yPos += 12;

        doc.setFont('helvetica', 'bold');
        doc.text('Recursos de Apoyo:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 6;
        plan.resources.forEach(r => {
            const lines = doc.splitTextToSize(`• ${r}`, 160);
            doc.text(lines, 25, yPos);
            yPos += lines.length * 5;
        });

        yPos += 4;
        doc.setFont('helvetica', 'bold');
        doc.text('Criterios de Éxito:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 6;
        plan.successCriteria.forEach(c => {
            const lines = doc.splitTextToSize(`• ${c}`, 160);
            doc.text(lines, 25, yPos);
            yPos += lines.length * 5;
        });

        yPos += 10;
    });

    // 5. Recomendaciones Adicionales
    if (yPos > 200) { doc.addPage(); yPos = 20; }

    doc.setTextColor(...themeColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('5. Recomendaciones Adicionales', 20, yPos);
    yPos += 10;

    const recCategories = [
        { title: 'Inmediatas', data: analysisData.recommendations.immediate },
        { title: 'Corto Plazo (1-3 meses)', data: analysisData.recommendations.shortTerm },
        { title: 'Largo Plazo (3+ meses)', data: analysisData.recommendations.longTerm }
    ];

    recCategories.forEach(cat => {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(cat.title, 20, yPos);
        yPos += 6;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        cat.data.forEach(item => {
            const lines = doc.splitTextToSize(`• ${item}`, 170);
            doc.text(lines, 25, yPos);
            yPos += lines.length * 5;
        });
        yPos += 8;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`Plan_Accion_IA_${teacherName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

