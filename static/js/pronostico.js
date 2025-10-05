document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const map = L.map('map').setView([-9.9, -76.2], 5);
    const latInput = document.getElementById('manual-lat');
    const lonInput = document.getElementById('manual-lon');
    const dateInput = document.getElementById('manual-date');
    const timeInput = document.getElementById('manual-time');
    const getManualBtn = document.getElementById('get-manual-btn');
    const resultsDiv = document.getElementById('results');
    
    // --- Search Elements ---
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    let dailyChart = null; 

    // --- MAP INITIALIZATION ---
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    let marker = null;

    // --- FUNCTIONS ---
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
                        label: 'Temperature (°C)',
                        data: chartData.temperatures,
                        borderColor: '#e74c3c',
                        yAxisID: 'y_temp_hum',
                        tension: 0.4
                    },
                    {
                        type: 'line',
                        label: 'Dew Point (°C)',
                        data: chartData.humidities,
                        borderColor: '#3498db',
                        yAxisID: 'y_temp_hum',
                        tension: 0.4
                    },
                    {
                        type: 'bar',
                        label: 'Precipitation (mm)',
                        data: chartData.precipitations,
                        backgroundColor: 'rgba(46, 204, 113, 0.5)',
                        yAxisID: 'y_precip',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Full Day Weather Forecast' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: { title: { display: true, text: 'Hour of the Day'} },
                    y_temp_hum: { type: 'linear', position: 'left', title: { display: true, text: '°C'} },
                    y_precip: { type: 'linear', position: 'right', title: { display: true, text: 'mm'}, grid: { drawOnChartArea: false }, beginAtZero: true }
                }
            }
        });
    }

    async function fetchData(lat, lon, date, time) {
        resultsDiv.innerHTML = `<p class="loading">Fetching data...</p>`;
        resultsDiv.style.display = 'block';
        try {
            const mainResponse = await fetch('/api/get_climate_data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lon, date, time }),
            });
            if (!mainResponse.ok) throw new Error('Could not retrieve description.');
            const mainData = await mainResponse.json();
            
            if (marker) map.removeLayer(marker);
            map.setView([lat, lon], 12);
            marker = L.marker([lat, lon]).addTo(map).bindPopup(`<b>${mainData.departamento || 'Location'}</b>`).openPopup();
            resultsDiv.innerHTML = `
                <h3>Results for ${mainData.departamento || 'the selected location'}</h3>
                <p class="result-description">${mainData.descripcion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                <div class="chart-container"><canvas id="daily-chart-canvas"></canvas></div>
            `;

            const chartResponse = await fetch('/api/daily_chart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lon, date }),
            });
            if (!chartResponse.ok) throw new Error('Could not fetch chart data.');
            const chartData = await chartResponse.json();
            renderDailyChart(chartData);
        } catch (error) {
            console.error("Error in fetchData:", error);
            resultsDiv.innerHTML = `<p class="error-message">Error connecting to the server.</p>`;
        }
    }
    
    // --- EVENTS ---
    getManualBtn.addEventListener('click', () => {
        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);
        const date = dateInput.value;
        const time = timeInput.value;
        if (isNaN(lat) || isNaN(lon) || !date || !time) { return alert('Please enter valid data.'); }
        fetchData(lat, lon, date, time);
    });
    
    map.on('click', (e) => {
        latInput.value = e.latlng.lat.toFixed(5);
        lonInput.value = e.latlng.lng.toFixed(5);
        if (marker) map.removeLayer(marker);
        marker = L.marker(e.latlng).addTo(map);
    });

    // --- SEARCH LOGIC ---
    async function handleSearch() {
        const placeName = searchInput.value.trim();
        if (placeName === '') {
            return alert('Please enter a place name to search.');
        }

        searchBtn.textContent = 'Searching...';
        searchBtn.disabled = true;

        try {
            const response = await fetch('/api/search_location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place_name: placeName })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Place not found.');
            }

            const data = await response.json();
            
            // Update latitude and longitude fields
            latInput.value = data.latitude.toFixed(5);
            lonInput.value = data.longitude.toFixed(5);

            // Update the map
            if (marker) map.removeLayer(marker);
            map.setView([data.latitude, data.longitude], 13);
            marker = L.marker([data.latitude, data.longitude]).addTo(map)
                .bindPopup(data.place_name)
                .openPopup();

        } catch (error) {
            alert(error.message);
        } finally {
            searchBtn.textContent = 'Search';
            searchBtn.disabled = false;
        }
    }

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Set today’s date by default
    dateInput.value = new Date().toISOString().split('T')[0];
});
