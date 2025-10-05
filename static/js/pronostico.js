document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const map = L.map('map').setView([-9.9, -76.2], 5);
    const latInput = document.getElementById('manual-lat');
    const lonInput = document.getElementById('manual-lon');
    const dateInput = document.getElementById('manual-date');
    const timeInput = document.getElementById('manual-time');
    const getManualBtn = document.getElementById('get-manual-btn');
    const resultsDiv = document.getElementById('results');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    // --- Elementos para el modal de agenda ---
    const agendaModal = document.getElementById('agenda-modal');

    let dailyChart = null; 
    let marker = null;

    // --- INICIALIZACIÓN DE MAPA ---
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // --- FUNCIONES ---

    // ¡NUEVO! Funciones para controlar el modal de la agenda
    function openAgendaModal(lugar, fecha, hora) {
        document.getElementById('evento-lugar').value = lugar;
        document.getElementById('evento-fecha').value = `${fecha} ${hora}`;
        document.getElementById('evento-desc').value = ''; // Limpiar descripción
        agendaModal.style.display = 'flex';
    }

    function closeAgendaModal() {
        agendaModal.style.display = 'none';
    }

    async function saveAgendaEvent() {
        const lugar = document.getElementById('evento-lugar').value;
        const [fecha, hora] = document.getElementById('evento-fecha').value.split(' ');
        const descripcion = document.getElementById('evento-desc').value;

        const saveBtn = document.getElementById('save-agenda-btn');
        saveBtn.textContent = "Guardando...";
        saveBtn.disabled = true;

        try {
            const response = await fetch('/api/agendar_evento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo: lugar, descripcion, fecha, hora })
            });

            const data = await response.json();

            if (!response.ok) {
                // Si la razón es 'No autorizado', redirigir al login
                if (response.status === 401) {
                    alert('Debes iniciar sesión para poder agendar un evento.');
                    window.location.href = '/login'; // Redirige al login
                } else {
                    throw new Error(data.error || 'Error al guardar el evento.');
                }
            } else {
                alert('¡Evento agendado con éxito!');
                closeAgendaModal();
            }

        } catch (error) {
            console.error("Error al guardar evento:", error);
            alert(error.message);
        } finally {
            saveBtn.textContent = "Guardar Evento";
            saveBtn.disabled = false;
        }
    }

    function renderDailyChart(chartData) {
        if (dailyChart) { dailyChart.destroy(); }
        const canvas = document.getElementById('daily-chart-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        dailyChart = new Chart(ctx, {
            type: 'bar', 
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        type: 'line',
                        label: 'Temperatura (°C)',
                        data: chartData.temperatures,
                        borderColor: '#e74c3c',
                        yAxisID: 'y_temp_hum',
                        tension: 0.4
                    },
                    {
                        type: 'line',
                        label: 'Punto de Rocío (°C)',
                        data: chartData.humidities,
                        borderColor: '#70c6ffff',
                        yAxisID: 'y_temp_hum',
                        tension: 0.4
                    },
                    {
                        type: 'bar',
                        label: 'Precipitación (mm)',
                        data: chartData.precipitations,
                        backgroundColor: 'rgba(0, 255, 106, 0.5)',
                        yAxisID: 'y_precip',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Pronóstico Climático para el Día Completo' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: { title: { display: true, text: 'Hora del Día'} },
                    y_temp_hum: { type: 'linear', position: 'left', title: { display: true, text: '°C'} },
                    y_precip: { type: 'linear', position: 'right', title: { display: true, text: 'mm'}, grid: { drawOnChartArea: false }, beginAtZero: true }
                }
            }
        });
    }

    async function fetchData(lat, lon, date, time) {
        resultsDiv.innerHTML = `<p class="loading">Consultando datos...</p>`;
        resultsDiv.style.display = 'block';
        try {
            const mainResponse = await fetch('/api/get_climate_data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lon, date, time }),
            });
            if (!mainResponse.ok) throw new Error('No se pudo obtener la descripción.');
            const mainData = await mainResponse.json();
            
            // --- ¡NUEVO! Lógica para mostrar el botón "Agendar" ---
            let agendarBtnHTML = '';
            const hoy = new Date();
            hoy.setHours(0,0,0,0); // Poner la hora a cero para comparar solo fechas
            const fechaConsultada = new Date(date + 'T00:00:00');

            if (fechaConsultada >= hoy) {
                agendarBtnHTML = `
                    <div class="agenda-btn-container">
                        <button id="agendar-btn">Agendar Visita</button>
                    </div>
                `;
            }
            
            if (marker) map.removeLayer(marker);
            map.setView([lat, lon], 12);
            marker = L.marker([lat, lon]).addTo(map).bindPopup(`<b>${mainData.departamento || 'Ubicación'}</b>`).openPopup();
            resultsDiv.innerHTML = `
                <h3>Resultados para ${mainData.departamento || 'la ubicación seleccionada'}</h3>
                <p class="result-description">${mainData.descripcion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                <div class="chart-container"><canvas id="daily-chart-canvas"></canvas></div>
                ${agendarBtnHTML} 
            `;

            // --- ¡NUEVO! Añadir evento al botón "Agendar" si existe ---
            if (fechaConsultada >= hoy) {
                document.getElementById('agendar-btn').addEventListener('click', () => {
                    openAgendaModal(mainData.departamento || 'Ubicación seleccionada', date, time);
                });
            }

            const chartResponse = await fetch('/api/daily_chart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lon, date }),
            });
            if (!chartResponse.ok) throw new Error('No se pudo obtener los datos del gráfico.');
            const chartData = await chartResponse.json();
            renderDailyChart(chartData);

        } catch (error) {
            console.error("Error en fetchData:", error);
            resultsDiv.innerHTML = `<p class="error-message">Error al conectar con el servidor.</p>`;
        }
    }
    
    // --- EVENTOS ---
    getManualBtn.addEventListener('click', () => {
        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);
        const date = dateInput.value;
        const time = timeInput.value;
        if (isNaN(lat) || isNaN(lon) || !date || !time) { return alert('Por favor, ingresa datos válidos.'); }
        fetchData(lat, lon, date, time);
    });
    
    map.on('click', (e) => {
        latInput.value = e.latlng.lat.toFixed(5);
        lonInput.value = e.latlng.lng.toFixed(5);
        if (marker) map.removeLayer(marker);
        marker = L.marker(e.latlng).addTo(map);
    });

    async function handleSearch() {
        const placeName = searchInput.value.trim();
        if (placeName === '') { return alert('Ingresa un nombre de lugar.'); }
        searchBtn.textContent = 'Buscando...';
        searchBtn.disabled = true;
        try {
            const response = await fetch('/api/search_location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place_name: placeName })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lugar no encontrado.');
            }
            const data = await response.json();
            latInput.value = data.latitude.toFixed(5);
            lonInput.value = data.longitude.toFixed(5);
            if (marker) map.removeLayer(marker);
            map.setView([data.latitude, data.longitude], 13);
            marker = L.marker([data.latitude, data.longitude]).addTo(map).bindPopup(data.place_name).openPopup();
        } catch (error) {
            alert(error.message);
        } finally {
            searchBtn.textContent = 'Buscar';
            searchBtn.disabled = false;
        }
    }

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { handleSearch(); }
    });

    // Eventos para el modal
    document.getElementById('cancel-agenda-btn').addEventListener('click', closeAgendaModal);
    document.getElementById('save-agenda-btn').addEventListener('click', saveAgendaEvent);
    agendaModal.addEventListener('click', (e) => {
        if (e.target === agendaModal) { closeAgendaModal(); }
    });

    dateInput.value = new Date().toISOString().split('T')[0];
});

