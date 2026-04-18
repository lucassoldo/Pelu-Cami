document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('appointments-tbody');
    const filterDate = document.getElementById('filter-date');
    const clearFilterBtn = document.getElementById('clear-filter');

    // Cargar todos los turnos al inicio
    loadAppointments();

    filterDate.addEventListener('change', (e) => {
        const date = e.target.value;
        if (date) {
            loadAppointments(date);
        }
    });

    clearFilterBtn.addEventListener('click', () => {
        filterDate.value = '';
        loadAppointments();
    });

    async function loadAppointments(date = '') {
        try {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Cargando...</td></tr>';
            
            const url = date ? `/api/appointments?date=${date}` : '/api/appointments';
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Error al obtener los datos');
            
            let appointments = await response.json();
            
            tbody.innerHTML = '';

            if (appointments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #888;">No hay turnos reservados.</td></tr>';
                return;
            }

            // Ordenar por fecha y luego por hora
            appointments.sort((a, b) => {
                if (a.date !== b.date) {
                    return a.date.localeCompare(b.date);
                }
                return a.time.localeCompare(b.time);
            });

            appointments.forEach(app => {
                const tr = document.createElement('tr');
                
                // Formatear la fecha
                const [year, month, day] = app.date.split('-');
                const formattedDate = `${day}/${month}/${year}`;

                tr.innerHTML = `
                    <td><strong>${formattedDate}</strong></td>
                    <td style="color: var(--primary-dark); font-weight: bold;">${app.time} hs</td>
                    <td>${app.clientName}</td>
                `;
                tbody.appendChild(tr);
            });

        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Error al cargar las reservas.</td></tr>';
        }
    }
});
