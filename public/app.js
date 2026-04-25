document.addEventListener('DOMContentLoaded', () => {
    const dateSelect = document.getElementById('date-select');
    const timeSlotsContainer = document.getElementById('time-slots');
    const modal = document.getElementById('booking-modal');
    const closeBtn = document.querySelector('.close-btn');
    const bookingForm = document.getElementById('booking-form');
    const modalDateTime = document.getElementById('modal-date-time');
    const hiddenDate = document.getElementById('hidden-date');
    const hiddenTime = document.getElementById('hidden-time');
    const toast = document.getElementById('toast');

    // Configurar la fecha mínima como hoy
    const today = new Date().toISOString().split('T')[0];
    dateSelect.min = today;

    // Horarios de la peluquería (8:00 a 18:00 cada media hora)
    const storeHours = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
        "17:00", "17:30", "18:00"
    ];

    // Evento al seleccionar una fecha
    dateSelect.addEventListener('change', async (e) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
            await loadAppointments(selectedDate);
        } else {
            timeSlotsContainer.innerHTML = '<p class="placeholder-text">Selecciona una fecha para ver los turnos disponibles.</p>';
        }
    });

    // Función para cargar y renderizar los turnos
    async function loadAppointments(date) {
        try {
            timeSlotsContainer.innerHTML = '<p class="placeholder-text">Cargando horarios...</p>';

            // Obtener turnos reservados desde el backend
            const response = await fetch(`/api/appointments?date=${date}`);
            if (!response.ok) throw new Error('Error al obtener turnos');
            const bookedAppointments = await response.json();

            // Mapear horas reservadas para fácil búsqueda
            const bookedTimes = bookedAppointments.map(app => app.time);

            timeSlotsContainer.innerHTML = ''; // Limpiar contenedor

            // Generar botones de horarios
            storeHours.forEach(time => {
                const isBooked = bookedTimes.includes(time);

                // Si la fecha es hoy, deshabilitar horas pasadas (opcional, para ser precisos)
                const isPast = isPastTime(date, time);

                const slot = document.createElement('div');
                slot.classList.add('time-slot');
                slot.textContent = time;

                if (isBooked || isPast) {
                    slot.classList.add('booked');
                    if (isPast && !isBooked) slot.title = "Horario pasado";
                    if (isBooked) slot.title = "Turno ocupado";
                } else {
                    slot.addEventListener('click', () => openModal(date, time));
                }

                timeSlotsContainer.appendChild(slot);
            });

        } catch (error) {
            console.error(error);
            showToast('Error al cargar los horarios', 'error');
            timeSlotsContainer.innerHTML = '<p class="placeholder-text">Hubo un problema al cargar los turnos.</p>';
        }
    }

    // Comprueba si una hora ya pasó hoy
    function isPastTime(selectedDate, timeStr) {
        if (selectedDate !== today) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const [slotHour, slotMinute] = timeStr.split(':').map(Number);

        if (slotHour < currentHour) return true;
        if (slotHour === currentHour && slotMinute <= currentMinute) return true;

        return false;
    }

    // Modal de reserva
    function openModal(date, time) {
        // Formatear fecha para mostrar
        const dateObj = new Date(date + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = dateObj.toLocaleDateString('es-ES', options);

        modalDateTime.textContent = `${dateString} a las ${time} hs`;
        hiddenDate.value = date;
        hiddenTime.value = time;
        document.getElementById('client-name').value = '';

        modal.classList.add('show');
    }

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Enviar formulario de reserva
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const clientName = document.getElementById('client-name').value.trim();
        const date = hiddenDate.value;
        const time = hiddenTime.value;

        if (!clientName) return;

        const submitBtn = bookingForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Reservando...';

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ clientName, date, time })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('¡Turno reservado con éxito!', 'success');
                modal.classList.remove('show');
                // Recargar los horarios
                loadAppointments(date);
            } else {
                showToast(data.error || 'Error al reservar', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error de conexión', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reservar Turno';
        }
    });

    // Sistema de notificaciones (Toast)
    let toastTimeout;
    function showToast(message, type) {
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
