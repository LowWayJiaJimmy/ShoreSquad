// ShoreSquad enhanced interactions: counters, events rendering, weather + map mock
document.addEventListener('DOMContentLoaded', () => {
  // Nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      if (mainNav.hasAttribute('hidden')) mainNav.removeAttribute('hidden');
      else mainNav.setAttribute('hidden', '');
    });
  }

  // Counter animation
  const counters = document.querySelectorAll('.metric-value');
  const animateCounters = () => {
    counters.forEach(el => {
      const target = +el.getAttribute('data-target') || 0;
      const step = Math.max(1, Math.floor(target / 100));
      let current = 0;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) { el.textContent = String(target); clearInterval(timer); }
        else el.textContent = String(current);
      }, 12);
    });
  };
  // Start after short delay
  setTimeout(animateCounters, 600);

  // Mock map interaction
  const mockBtn = document.getElementById('mock-add-marker');
  if (mockBtn) mockBtn.addEventListener('click', () => {
    const p = document.createElement('p');
    p.textContent = `Marker added at ${new Date().toLocaleTimeString()}`;
    p.className = 'muted';
    document.getElementById('map-placeholder').appendChild(p);
  });

  // Render sample events (like examples)
  const sampleEvents = [
    {title:'Pasir Ris Beach Cleanup', location:'Pasir Ris Beach, Singapore', time:'Jun 1 — 09:00 AM', squadCount:812},
    {title:'East Coast Park Squad Action', location:'East Coast Park, Singapore', time:'Jun 3 — 08:30 AM', squadCount:48},
    {title:'Sentosa Beach Conservation', location:'Sentosa Beach, Singapore', time:'Jun 7 — 07:00 AM', squadCount:1115}
  ];
  const eventsGrid = document.getElementById('events-grid');
  if (eventsGrid) {
    sampleEvents.forEach(ev => {
      const card = document.createElement('div'); card.className = 'event-card';
      card.innerHTML = `<h4>${ev.title}</h4><div class="muted">${ev.location}</div><div>${ev.time}</div><div style="margin-top:.5rem"><strong>${ev.squadCount}</strong> squad members <button class="btn small">Join</button></div>`;
      eventsGrid.appendChild(card);
    });
  }

  // Weather lookup and render (Open-Meteo)
  const getWeatherBtn = document.getElementById('get-weather');
  const tempEl = document.getElementById('weather-temp');
  const descEl = document.getElementById('weather-desc');
  const humEl = document.getElementById('weather-humidity');
  const windEl = document.getElementById('weather-wind');
  const forecastEl = document.getElementById('forecast');

  if (getWeatherBtn) {
    // Named fetch function so we can call it on load as well as on click
    async function fetchWeather() {
      tempEl.textContent = 'Locating...';
      forecastEl.innerHTML = '';
      try {
        const pos = await getCurrentPosition({enableHighAccuracy:false,timeout:8000});
        const lat = pos.coords.latitude; const lon = pos.coords.longitude;
        tempEl.textContent = 'Fetching...';

        // Fetch current weather from Open-Meteo (metric units: °C, km/h)
        const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
        const neaUrl = 'https://api.data.gov.sg/v1/environment/4-day-weather-forecast';

        const [omRes, neaRes] = await Promise.allSettled([fetch(omUrl), fetch(neaUrl)]);

        // Handle Open-Meteo response
        if (omRes.status === 'fulfilled' && omRes.value.ok) {
          const data = await omRes.value.json();
          const w = data.current_weather;
          tempEl.textContent = `${Math.round(w.temperature)}°C`;
          descEl.textContent = `Wind ${Math.round(w.windspeed)} km/h`;
          humEl.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
          windEl.textContent = `Direction: ${Math.round(w.winddirection)}°`;
        } else {
          tempEl.textContent = 'Current weather unavailable';
          descEl.textContent = '';
        }

        // Handle NEA 4-day forecast (textual forecasts for Singapore)
        if (neaRes.status === 'fulfilled' && neaRes.value.ok) {
          const neaData = await neaRes.value.json();
          const items = neaData.items || [];
          if (items.length && items[0].forecasts) {
            const forecasts = items[0].forecasts; // array of {date, forecast}
            forecastEl.innerHTML = '';
            forecasts.slice(0, 7).forEach(f => {
              const day = document.createElement('div'); day.className = 'day';
              const date = new Date(f.date);
              const weekday = date.toLocaleDateString(undefined,{weekday:'short'});
              // Shorten forecast text for layout
              const text = (f.forecast || '').replace(/\s+/g,' ').trim();
              day.innerHTML = `<div><strong>${weekday}</strong></div><div style="font-size:.95rem">${text}</div>`;
              forecastEl.appendChild(day);
            });
          } else {
            forecastEl.innerHTML = '<div class="muted">NEA forecast not available</div>';
          }
        } else {
          forecastEl.innerHTML = '<div class="muted">NEA forecast unavailable</div>';
        }

      } catch (err) {
        tempEl.textContent = 'Unable to get weather';
        descEl.textContent = err.message || err;
        forecastEl.innerHTML = '<div class="muted">Forecast unavailable</div>';
      }
    }

    getWeatherBtn.addEventListener('click', fetchWeather);

    // Start weather check immediately when the page opens
    // (This will prompt for geolocation permission from the browser.)
    setTimeout(() => {
      try { fetchWeather(); } catch (e) { console.warn('Auto weather fetch failed', e); }
    }, 400);
  }
  
  // Initialize Leaflet map for Next Cleanup (Pasir Ris)
  const mapContainer = document.getElementById('mapid');
  if (mapContainer && typeof L !== 'undefined') {
    try {
      const lat = 1.381497, lon = 103.955574;
      const map = L.map('mapid', {scrollWheelZoom:false}).setView([lat, lon], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([lat, lon]).addTo(map);
      marker.bindPopup('<strong>Next Cleanup</strong><br>Pasir Ris Beach<br>Street View Asia 1.381497, 103.955574').openPopup();

      // Open in Google Maps button
      const openBtn = document.getElementById('open-google');
      if (openBtn) {
        openBtn.addEventListener('click', () => {
          const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
          window.open(url, '_blank', 'noopener');
        });
      }
    } catch (err) {
      console.warn('Leaflet init failed', err);
    }
  }
});

function getCurrentPosition(options){
  return new Promise((resolve,reject)=>{
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

if (typeof module !== 'undefined') module.exports = { getCurrentPosition };
