# Manual de Operación y Flujo de Usuario - Education Walkthrough

Este documento detalla el funcionamiento paso a paso de la aplicación **Education Walkthrough** (Learning Walk), diseñada para la observación sistemática del desempeño docente basado en el Marco de Danielson.

---

## 1. Introducción
La aplicación permite a los directivos y coordinadores realizar visitas rápidas a las aulas (Walkthroughs), registrar indicadores de desempeño, capturar evidencias y generar reportes automáticos en PDF para retroalimentación inmediata.

---

| Rol | Funciones Principales | Dashboard Principal | Visibilidad |
| :--- | :--- | :--- | :--- |
| **Admin / Rector** | Gestión total y rectoría. | Admin (Global) | Todos los campus y docentes del distrito. |
| **Supervisor** | Supervisión de cumplimiento. | Admin (Global) | Visión global de todos los campus. |
| **Director de Campus** | Supervisión táctica. | Admin (Filtrado) | **Solo los datos de su campus asignado.** |
| **Coordinador** | Operación y observación. | Coordinador | Solo sus maestros asignados. |

---

## 3. Flujo Operativo Paso a Paso

### Fase 1: Configuración Inicial (Solo Admins)
1.  **Entrada**: Acceder a `Team Management` (Gestión de Equipo).
2.  **Crear Usuarios**: Agregar a los Coordinadores y Directores proporcionando su correo y rol.
3.  **Seguridad**: El sistema enviará un correo para que el nuevo usuario establezca su contraseña.

### Fase 2: Gestión de Maestros (Admin y Coordinador)
1.  **Registro**: Acceder a `Teacher Management`.
2.  **Alta de Maestros**: Registrar el nombre completo de los docentes.
3.  **Configuración de Antigüedad**: 
    *   **Nuevo**: Requiere observación **semanal**.
    *   **Antigüedad**: Requiere observación **quincenal**.
4.  **Asignación**: (Solo Admin) Asignar cada maestro al coordinador responsable de su evaluación.

### Fase 3: Ejecución de una Observación (Coordinador)
1.  **Selección**: Ir a la pestaña `Observations`.
2.  **Marco de Trabajo**: Seleccionar el tipo de observación (ej. Danielson Framework).
3.  **Datos de Clase**:
    *   Seleccionar al maestro de la lista desplegable.
    *   Indicar la materia o grado (ej. Math 101).
4.  **Evaluación**:
    *   Navegar por los Dominios (Planeación, Ambiente de Clase, Instrucción, etc.).
    *   Calificar cada indicador del 1 al 4.
    *   **Nota**: Es vital agregar comentarios en el recuadro "Evidence" para justificar la calificación.
5.  **Finalización**: Hacer clic en **Finalize Report**. Esto guardará los datos en la base de datos y descargará automáticamente un reporte en **PDF**.

### Fase 4: Seguimiento y Cumplimiento (Dashboards)
1.  **Vista General**: En el `Dashboard`, se pueden ver gráficas de tendencias y promedios de desempeño.
    *   El sistema utiliza un **Semáforo de Cumplimiento**:
        *   **Verde (OK):** Al menos una observación realizada en el periodo actual.
        *   **Amarillo (Pendiente):** Sin observaciones en el periodo (semana para nuevos, quincena para titulares).

### Fase 5: Reportes e Histórico
1.  **Consulta**: En la sección `Reports`, se pueden buscar observaciones pasadas por fecha o por maestro.
2.  **Descarga**: Se pueden volver a generar los PDFs de visitas anteriores si es necesario.

---

## 4. Usuarios de Prueba (Testing)
Se han creado las siguientes cuentas para validar los nuevos niveles de acceso y la lógica de semáforos:

| Rol | Email | Contraseña | Dashboard Esperado |
| :--- | :--- | :--- | :--- |
| **Rector/Global** | `rector.test@example.com` | `Password123` | Vista de todos los campus y coordinadores. |
| **Director (Mitras)** | `director.mitras@example.com` | `Password123` | Solo datos del campus **Mitras**. |
| **Coordinador (Mitras)** | `coord.mitras@example.com` | `Password123` | Solo sus maestros asignados (Mitras). |

> **Nota:** Todos los maestros del campus Mitras han sido asignados automáticamente al coordinador de prueba para facilitar la validación inmediata del semáforo (aparecerán en amarillo hasta que se realice una observación).

---

## 5. Gestión de Acceso y Seguridad
*   **Recuperación de Contraseña**: Si un usuario olvida su clave, puede hacer clic en **"Forgot password?"** en la pantalla de inicio. Recibirá un enlace por correo para crear una nueva clave de forma segura.
*   **Perfil**: En `Settings`, cada usuario puede actualizar su nombre y cambiar su contraseña activamente.

---

## 6. Verificación de Funcionamiento (Checklist)
Para asegurar que todo está operando correctamente, verifique lo siguiente:
- [ ] ¿Los maestros asignados a un coordinador solo le aparecen a él en la lista de observaciones?
- [ ] ¿El Director de Mitras solo ve el cumplimiento de su campus y no el de otros?
- [ ] ¿El Rector/Admin puede ver las gráficas de todos los campus en conjunto?
- [ ] ¿El semáforo del coordinador inicia en **Amarillo** cada inicio de periodo (semana/quincena)?
- [ ] ¿El semáforo cambia a **Verde** inmediatamente después de finalizar un reporte?
- [ ] ¿Se descarga el PDF inmediatamente después de dar clic en "Finalize"?
- [ ] ¿Llegan los correos de recuperación de contraseña?

---
*Este manual es una guía dinámica y debe actualizarse si se añaden nuevos módulos o cambios en la lógica de negocio.*
