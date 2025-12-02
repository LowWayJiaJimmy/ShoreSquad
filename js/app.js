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
    getWeatherBtn.addEventListener('click', async () => {
      tempEl.textContent = 'Locating...';
      try {
        const pos = await getCurrentPosition({enableHighAccuracy:false,timeout:8000});
        const lat = pos.coords.latitude; const lon = pos.coords.longitude;
        tempEl.textContent = 'Fetching...';
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        const w = data.current_weather;
        tempEl.textContent = `${Math.round(w.temperature)}°C`;
        descEl.textContent = `Wind ${Math.round(w.windspeed)} km/h`;
        humEl.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        windEl.textContent = `Direction: ${w.winddirection}°`;
        // Render simple daily forecast if available
        forecastEl.innerHTML = '';
        if (data.daily && data.daily.time) {
          for (let i=0;i<Math.min(4,data.daily.time.length);i++){
            const d = data.daily;
            const day = document.createElement('div'); day.className='day';
            const date = new Date(d.time[i]);
            day.innerHTML = `<div>${date.toLocaleDateString(undefined,{weekday:'short'})}</div><div>${Math.round(d.temperature_2m_max[i])}°/${Math.round(d.temperature_2m_min[i])}°</div>`;
            forecastEl.appendChild(day);
          }
        }
      } catch (err) {
        tempEl.textContent = 'Unable to get weather';
        descEl.textContent = err.message || err;
      }
    });
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
