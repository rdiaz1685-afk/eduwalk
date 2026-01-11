// Servicio para manejar el control de semanas y quincenas del ciclo escolar

export const WeekService = {
    // Obtener el año escolar actual (septiembre - junio)
    getCurrentSchoolYear() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // Meses son 0-11

        // Si estamos entre enero y junio, el ciclo escolar es del año anterior al actual
        // Si estamos entre julio y diciembre, el ciclo es del año actual al siguiente
        if (currentMonth >= 7) { // Julio-diciembre
            return {
                startYear: currentYear,
                endYear: currentYear + 1,
                name: `${currentYear}-${currentYear + 1}`
            };
        } else { // Enero-junio
            return {
                startYear: currentYear - 1,
                endYear: currentYear,
                name: `${currentYear - 1}-${currentYear}`
            };
        }
    },

    // Obtener la semana actual del ciclo escolar
    getCurrentWeek() {
        const schoolYear = this.getCurrentSchoolYear();
        const now = new Date();

        // Fecha de inicio: primer lunes de septiembre
        const startDate = new Date(schoolYear.startYear, 8, 1); // 8 = septiembre
        const startDay = startDate.getDay();
        const daysUntilMonday = (8 - startDay) % 7 || 7;
        startDate.setDate(startDate.getDate() + daysUntilMonday);

        // Calcular semanas desde el inicio
        const diffTime = Math.abs(now - startDate);
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

        return Math.max(1, diffWeeks);
    },

    // Obtener la quincena actual
    getCurrentFortnight() {
        const currentWeek = this.getCurrentWeek();
        return Math.ceil(currentWeek / 2);
    },

    // Obtener el rango de fechas de una semana específica
    getWeekDateRange(weekNumber) {
        const schoolYear = this.getCurrentSchoolYear();

        // Fecha de inicio: primer lunes de septiembre
        const startDate = new Date(schoolYear.startYear, 8, 1);
        const startDay = startDate.getDay();
        const daysUntilMonday = (8 - startDay) % 7 || 7;
        startDate.setDate(startDate.getDate() + daysUntilMonday);

        // Calcular fecha de la semana solicitada
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return {
            number: weekNumber,
            start: weekStart,
            end: weekEnd,
            label: `Semana ${weekNumber}`,
            display: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
        };
    },

    // Obtener el rango de fechas de una quincena específica
    getFortnightDateRange(fortnightNumber) {
        const startWeek = (fortnightNumber - 1) * 2 + 1;
        const endWeek = startWeek + 1;

        const startRange = this.getWeekDateRange(startWeek);
        const endRange = this.getWeekDateRange(endWeek);

        return {
            number: fortnightNumber,
            start: startRange.start,
            end: endRange.end,
            label: `Quincena ${fortnightNumber}`,
            display: `${startRange.start.toLocaleDateString()} - ${endRange.end.toLocaleDateString()}`,
            weeks: [startWeek, endWeek]
        };
    },

    // Obtener todas las semanas del ciclo escolar
    getAllSchoolWeeks() {
        const schoolYear = this.getCurrentSchoolYear();
        const weeks = [];

        // Calcular semanas hasta fin de junio del siguiente año
        const endDate = new Date(schoolYear.endYear, 5, 30); // 5 = junio

        const startDate = new Date(schoolYear.startYear, 8, 1);
        const startDay = startDate.getDay();
        const daysUntilMonday = (8 - startDay) % 7 || 7;
        startDate.setDate(startDate.getDate() + daysUntilMonday);

        let weekNumber = 1;
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 6);

            weeks.push({
                number: weekNumber,
                start: new Date(currentDate),
                end: weekEnd,
                label: `Semana ${weekNumber}`,
                display: `${currentDate.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
                isCurrent: this.getCurrentWeek() === weekNumber
            });

            currentDate.setDate(currentDate.getDate() + 7);
            weekNumber++;
        }

        return weeks;
    },

    // Obtener todas las quincenas del ciclo escolar
    getAllSchoolFortnights() {
        const weeks = this.getAllSchoolWeeks();
        const fortnights = [];

        for (let i = 0; i < weeks.length; i += 2) {
            const fortnightNumber = Math.floor(i / 2) + 1;
            const startWeek = weeks[i];
            const endWeek = weeks[i + 1] || startWeek; // Por si hay una semana sola al final

            fortnights.push({
                number: fortnightNumber,
                start: startWeek.start,
                end: endWeek.end,
                label: `Quincena ${fortnightNumber}`,
                display: `${startWeek.start.toLocaleDateString()} - ${endWeek.end.toLocaleDateString()}`,
                weeks: [startWeek.number, endWeek.number],
                isCurrent: this.getCurrentFortnight() === fortnightNumber
            });
        }

        return fortnights;
    },

    // Obtener semanas recientes para el dashboard
    getRecentWeeks(count = 4) {
        const currentWeek = this.getCurrentWeek();
        const weeks = [];

        for (let i = count - 1; i >= 0; i--) {
            const weekNumber = Math.max(1, currentWeek - i);
            weeks.push(this.getWeekDateRange(weekNumber));
        }

        return weeks;
    },

    // Obtener quincenas recientes para el dashboard
    getRecentFortnights(count = 4) {
        const currentFortnight = this.getCurrentFortnight();
        const fortnights = [];

        for (let i = count - 1; i >= 0; i--) {
            const fortnightNumber = Math.max(1, currentFortnight - i);
            fortnights.push(this.getFortnightDateRange(fortnightNumber));
        }

        return fortnights;
    },

    // Obtener la semana actual y las siguientes para programación
    getUpcomingWeeks(count = 8) {
        const currentWeek = this.getCurrentWeek();
        const weeks = [];

        for (let i = 0; i < count; i++) {
            weeks.push(this.getWeekDateRange(currentWeek + i));
        }

        return weeks;
    },

    // Obtener la quincena actual y las siguientes para programación
    getUpcomingFortnights(count = 4) {
        const currentFortnight = this.getCurrentFortnight();
        const fortnights = [];

        for (let i = 0; i < count; i++) {
            fortnights.push(this.getFortnightDateRange(currentFortnight + i));
        }

        return fortnights;
    },

    // Formatear fecha para mostrar
    formatDate(date) {
        return new Intl.DateTimeFormat('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    },

    // Obtener días restantes para observación en la semana/quincena actual
    getRemainingDays(periodType = 'weekly', periodNumber = null) {
        const currentPeriod = periodNumber || (periodType === 'weekly' ? this.getCurrentWeek() : this.getCurrentFortnight());
        const dateRange = periodType === 'weekly'
            ? this.getWeekDateRange(currentPeriod)
            : this.getFortnightDateRange(currentPeriod);

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Inicio del día

        // Filtrar solo días laborables (lunes a viernes)
        const workDays = [];
        const currentDate = new Date(dateRange.start);

        while (currentDate <= dateRange.end) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 1 = lunes, 5 = viernes
                workDays.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calcular días restantes (hoy y futuros)
        const remainingDays = workDays.filter(day => day >= today);

        return {
            totalWorkDays: workDays.length,
            remainingDays: remainingDays.length,
            remainingDates: remainingDays,
            isWeekend: today.getDay() === 0 || today.getDay() === 6,
            todayIsWorkDay: today.getDay() >= 1 && today.getDay() <= 5,
            periodLabel: periodType === 'weekly' ? `Semana ${currentPeriod}` : `Quincena ${currentPeriod}`,
            urgencyLevel: this.getUrgencyLevel(remainingDays.length, workDays.length)
        };
    },

    // Determinar nivel de urgencia
    getUrgencyLevel(remainingDays, totalDays) {
        const percentage = (remainingDays / totalDays) * 100;
        if (percentage <= 20) return 'critical';
        if (percentage <= 50) return 'high';
        if (percentage <= 80) return 'medium';
        return 'low';
    },

    // Verificar si se puede observar hoy
    canObserveToday() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Lunes a viernes
    },

    // Obtener próximo día laborable
    getNextWorkDay() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
            tomorrow.setDate(tomorrow.getDate() + 1);
        }

        return tomorrow;
    },
    async getWeekCompliance(weekNumber, coordinatorId = null) {
        try {
            const dateRange = this.getWeekDateRange(weekNumber);

            let query = `
                SELECT 
                    t.id as teacher_id,
                    t.full_name as teacher_name,
                    c.id as coordinator_id,
                    c.full_name as coordinator_name,
                    COUNT(o.id) as observation_count,
                    CASE 
                        WHEN COUNT(o.id) > 0 THEN 'completed'
                        ELSE 'pending'
                    END as status
                FROM teachers t
                LEFT JOIN profiles c ON t.coordinator_id = c.id
                LEFT JOIN observations o ON t.id = o.teacher_id 
                    AND o.created_at >= '${dateRange.start.toISOString()}'
                    AND o.created_at <= '${dateRange.end.toISOString()}'
            `;

            if (coordinatorId) {
                query += ` WHERE t.coordinator_id = '${coordinatorId}'`;
            }

            query += `
                GROUP BY t.id, t.full_name, c.id, c.full_name
                ORDER BY c.full_name, t.full_name
            `;

            const { data, error } = await supabase.rpc('execute_sql', { sql_query: query });

            if (error) throw error;

            return {
                weekNumber,
                dateRange,
                teachers: data || [],
                totalTeachers: data?.length || 0,
                completedTeachers: data?.filter(t => t.observation_count > 0).length || 0,
                complianceRate: data?.length > 0 ?
                    (data.filter(t => t.observation_count > 0).length / data.length * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('Error getting week compliance:', error);
            return null;
        }
    },

    // Obtener resumen de cumplimiento por coordinador
    async getCoordinatorComplianceSummary(coordinatorId, weekCount = 8) {
        try {
            const currentWeek = this.getCurrentWeek();
            const summaries = [];

            for (let i = weekCount - 1; i >= 0; i--) {
                const weekNumber = Math.max(1, currentWeek - i);
                const compliance = await this.getWeekCompliance(weekNumber, coordinatorId);

                if (compliance) {
                    summaries.push({
                        weekNumber,
                        dateRange: compliance.dateRange,
                        totalTeachers: compliance.totalTeachers,
                        completedTeachers: compliance.completedTeachers,
                        complianceRate: compliance.complianceRate,
                        status: compliance.complianceRate >= 100 ? 'compliant' :
                            compliance.complianceRate >= 50 ? 'partial' : 'non-compliant'
                    });
                }
            }

            return summaries;
        } catch (error) {
            console.error('Error getting coordinator compliance summary:', error);
            return [];
        }
    }
};
