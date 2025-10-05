// --- CONFIGURACIÓN DE TAILWIND ---
// Esto debe estar aquí para que Tailwind se aplique a los elementos creados dinámicamente
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: { "primary": "#66aaff", "surface-dark": "#0d1c3b" },
            fontFamily: { "display": ["Outfit", "Space Grotesk", "sans-serif"] },
        },
    },
};

// --- PLANTILLA HTML PARA CADA TARJETA ---
const cardTemplate = (data, cardId) => `
  <div class="flex flex-col gap-6">
    <div id="mapa-${cardId}" class="aspect-video w-full rounded-lg shadow-md border border-white/10"></div>
    <div class="flex gap-2">
      <button id="location-btn-${cardId}" class="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors">
        <span class="material-symbols-outlined">my_location</span>
        <span>Mi Ubicación</span>
      </button>
      <button id="simular-btn-${cardId}" class="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-500/20 text-blue-300 font-semibold hover:bg-blue-500/30 transition-colors">
        <span class="material-symbols-outlined">movie</span>
        <span>Ver Video</span>
      </button>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm mb-1 text-gray-400">Latitud</label>
        <input id="lat-input-${cardId}" class="w-full rounded-lg p-3 border border-white/20 bg-transparent" type="text" placeholder="0.0000" value="${data.lat || ''}"/>
      </div>
      <div>
        <label class="block text-sm mb-1 text-gray-400">Longitud</label>
        <input id="lon-input-${cardId}" class="w-full rounded-lg p-3 border border-white/20 bg-transparent" type="text" placeholder="0.0000" value="${data.lon || ''}"/>
      </div>
      <div>
        <label class="block text-sm mb-1 text-gray-400">Fecha</label>
        <input id="date-input-${cardId}" class="w-full rounded-lg p-3 border border-white/20 bg-transparent" type="date" value="${data.fecha}"/>
      </div>
      <div>
        <label class="block text-sm mb-1 text-gray-400">Hora</label>
        <input id="time-input-${cardId}" class="w-full rounded-lg p-3 border border-white/20 bg-transparent" type="time" value="${data.hora}"/>
      </div>
    </div>
    <button id="consultar-btn-${cardId}" class="w-full py-3 px-4 rounded-lg bg-primary text-white font-bold hover:opacity-90 transition-opacity">Consultar Datos</button>
    <div id="results-${cardId}" class="border-t border-white/20 pt-6">
      <h3 class="text-lg font-bold mb-4">Resultados</h3>
      <div class="space-y-4 text-sm">
        <div class="flex justify-between py-2 border-b border-white/10"><span>Ciudad</span><span class="font-semibold text-white">${data.ciudad}</span></div>
        <div class="flex justify-between py-2 border-b border-white/10"><span>País</span><span class="font-semibold text-white">${data.pais}</span></div>
        <div class="flex justify-between py-2 border-b border-white/10"><span>Fecha y Hora</span><span class="font-semibold text-white">${data.fecha}, ${data.hora}</span></div>
        <div class="flex justify-between py-2 border-b border-white/10"><span>Pronóstico</span><span class="font-semibold text-white">${data.pronostico}</span></div>
        <div class="flex justify-between py-2 border-b border-white/10"><span>Precipitación (mm)</span><span class="font-semibold text-white">${data.precipitacion}</span></div>
        <div class="flex justify-between py-2 border-b border-white/10"><span>Humedad Relativa</span><span class="font-semibold text-white">${data.humedad}%</span></div>
      </div>
      <div class="mt-6 p-4 bg-primary/10 rounded-lg flex items-center justify-between">
        <div><p class="text-sm">Temperatura</p><p class="text-2xl font-bold text-white">${data.temp}°C</p></div>
        <span class="material-symbols-outlined text-4xl text-primary">thermostat</span>
      </div>
    </div>
  </div>
`;

// --- LÓGICA DE LA APLICACIÓN ---

// Base de datos de videos
const videoDatabase = {
    "-13.1631,-72.5450": { // Machu Picchu
        day: "/static/videos/MachuPichuDia.mp4"
    },
};

function initializeCard(cardId, initialData) {
    const cardContainer = document.getElementById(`card${cardId}`);
    cardContainer.innerHTML = cardTemplate(initialData, cardId);

    // Inicializar mapa de Leaflet
    const map = L.map(`mapa-${cardId}`).setView([initialData.lat, initialData.lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    let marker = L.marker([initialData.lat, initialData.lon]).addTo(map);
    
    // Asignar eventos a los elementos de esta tarjeta
    const consultarBtn = document.getElementById(`consultar-btn-${cardId}`);
    const locationBtn = document.getElementById(`location-btn-${cardId}`);
    const simularBtn = document.getElementById(`simular-btn-${cardId}`);
    const latInput = document.getElementById(`lat-input-${cardId}`);
    const lonInput = document.getElementById(`lon-input-${cardId}`);

    // Evento para consultar datos
    consultarBtn.addEventListener('click', async () => {
        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);
        const date = document.getElementById(`date-input-${cardId}`).value;
        const time = document.getElementById(`time-input-${cardId}`).value;

        if (isNaN(lat) || isNaN(lon) || !date || !time) {
            alert("Por favor, completa todos los campos.");
            return;
        }
        
        consultarBtn.textContent = "Consultando...";
        consultarBtn.disabled = true;
        
        try {
            const response = await fetch('/api/get_comparison_data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lon, date, time })
            });
            const data = await response.json();
            
            data.lat = lat;
            data.lon = lon;
            initializeCard(cardId, data); // Re-renderiza la tarjeta con los nuevos datos
        } catch (error) {
            alert("Error al conectar con el servidor.");
            consultarBtn.textContent = "Consultar Datos";
            consultarBtn.disabled = false;
        }
    });

    // Evento para usar ubicación actual
    locationBtn.addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition(position => {
            latInput.value = position.coords.latitude.toFixed(6);
            lonInput.value = position.coords.longitude.toFixed(6);
            consultarBtn.click();
        });
    });

    // Evento para clic en el mapa
    map.on('click', function(e) {
        latInput.value = e.latlng.lat.toFixed(6);
        lonInput.value = e.latlng.lng.toFixed(6);
        if (marker) map.removeLayer(marker);
        marker = L.marker(e.latlng).addTo(map);
    });

    // Evento para simular video
    simularBtn.addEventListener('click', () => {
        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);
        const mapaDiv = document.getElementById(`mapa-${cardId}`);
        
        let closestCoords = null;
        let minDistance = Infinity;
        for (const coords in videoDatabase) {
            const [dbLat, dbLon] = coords.split(',').map(Number);
            const distance = Math.sqrt(Math.pow(lat - dbLat, 2) + Math.pow(lon - dbLon, 2));
            if (distance < minDistance) {
                minDistance = distance;
                closestCoords = coords;
            }
        }
        
        if (minDistance < 0.1 && videoDatabase[closestCoords].day) {
            mapaDiv.innerHTML = `<video class="w-full h-full rounded-lg object-cover" autoplay loop muted><source src="${videoDatabase[closestCoords].day}" type="video/mp4"></video>`;
        } else {
            alert("No hay video de simulación para esta ubicación.");
        }
    });
}

// --- INICIALIZACIÓN DE LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    const initialData1 = {
        ciudad: "Lima", pais: "Perú", fecha: today, hora: now,
        pronostico: "...", temp: "...", precipitacion: "...", humedad: "...",
        lat: -12.0464, lon: -77.0428
    };
    const initialData2 = {
        ciudad: "Arequipa", pais: "Perú", fecha: today, hora: now,
        pronostico: "...", temp: "...", precipitacion: "...", humedad: "...",
        lat: -16.4090, lon: -71.5375
    };

    initializeCard(1, initialData1);
    initializeCard(2, initialData2);
});
