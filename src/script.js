document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const searchInput = document.getElementById('city-search');
    const searchButton = document.getElementById('search-btn');

    const getWeatherInfo = (wmoCode, isDay = 1) => {
        const mappings = { 0: { desc: "Clear sky", icon: isDay ? "fa-sun" : "fa-moon" }, 1: { desc: "Mainly clear", icon: isDay ? "fa-cloud-sun" : "fa-cloud-moon" }, 2: { desc: "Partly cloudy", icon: isDay ? "fa-cloud-sun" : "fa-cloud-moon" }, 3: { desc: "Overcast", icon: "fa-cloud" }, 45: { desc: "Fog", icon: "fa-smog" }, 48: { desc: "Rime fog", icon: "fa-smog" }, 51: { desc: "Light drizzle", icon: "fa-cloud-rain" }, 53: { desc: "Drizzle", icon: "fa-cloud-rain" }, 55: { desc: "Dense drizzle", icon: "fa-cloud-rain" }, 61: { desc: "Slight rain", icon: "fa-cloud-showers-heavy" }, 63: { desc: "Rain", icon: "fa-cloud-showers-heavy" }, 65: { desc: "Heavy rain", icon: "fa-cloud-showers-heavy" }, 71: { desc: "Slight snow", icon: "fa-snowflake" }, 73: { desc: "Snow", icon: "fa-snowflake" }, 75: { desc: "Heavy snow", icon: "fa-snowflake" }, 77: { desc: "Snow grains", icon: "fa-snowflake" }, 80: { desc: "Slight showers", icon: "fa-cloud-sun-rain" }, 81: { desc: "Showers", icon: "fa-cloud-sun-rain" }, 82: { desc: "Violent showers", icon: "fa-cloud-sun-rain" }, 85: { desc: "Slight snow showers", icon: "fa-snowflake" }, 86: { desc: "Heavy snow showers", icon: "fa-snowflake" }, 95: { desc: "Thunderstorm", icon: "fa-cloud-bolt" }, 96: { desc: "Thunderstorm + Hail", icon: "fa-cloud-bolt" }, 99: { desc: "Thunderstorm + Heavy Hail", icon: "fa-cloud-bolt" }, };
        return mappings[wmoCode] || { desc: "Unknown", icon: "fa-circle-question" };
    };
    const degreesToCardinal = (deg) => { const d=["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"]; return d[Math.round(deg/22.5)%16]; };
    const formatDuration = (s) => `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;

    // --- DYNAMIC TEMPERATURE-BASED BACKGROUND ---
    const updateDynamicBackground = (temp) => {
        let startColor, endColor;
        if (temp <= 0) { // Freezing
            startColor = '#1e3a8a'; endColor = '#312e81';
        } else if (temp > 0 && temp <= 15) { // Cool
            startColor = '#0e7490'; endColor = '#1d4ed8';
        } else if (temp > 15 && temp <= 25) { // Moderate
            startColor = '#059669'; endColor = '#0f766e';
        } else if (temp > 25 && temp < 35) { // Warm
            startColor = '#f97316'; endColor = '#d97706';
        } else { // Hot
            startColor = '#dc2626'; endColor = '#ea580c';
        }
        document.body.style.backgroundImage = `linear-gradient(180deg, ${startColor} 0%, #0f172a 100%)`;
    };

    // --- UI UPDATE FUNCTIONS ---
    const updateUI = (data) => {
        updateDynamicBackground(data.current.temperature_2m);
        updateCurrentWeather(data);
        updateDetails(data);
        updateHourlyForecast(data);
        updateDailyForecast(data);
    };
    
    const updateCurrentWeather = ({ current }) => {
        const weatherInfo = getWeatherInfo(current.weather_code, current.is_day);
        document.getElementById('current-date').textContent = new Date(current.time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
        document.getElementById('current-temp').innerHTML = `${Math.round(current.temperature_2m)}<span class="text-4xl align-super">°C</span>`;
        document.getElementById('current-icon').className = `weather-icon fa-solid ${weatherInfo.icon} text-8xl md:text-9xl text-cyan-300`;
        document.getElementById('current-desc').textContent = weatherInfo.desc;
    };

    const updateDetails = ({ current, daily }) => {
        document.getElementById('sunrise-time').textContent = new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
        document.getElementById('sunset-time').textContent = new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
        document.getElementById('daylight-duration').textContent = formatDuration(daily.daylight_duration[0]);
        document.getElementById('uv-index').textContent = daily.uv_index_max[0].toFixed(1);
        document.getElementById('wind-speed').textContent = `${current.wind_speed_10m.toFixed(1)} km/h`;
        document.getElementById('wind-gusts').textContent = `${current.wind_gusts_10m.toFixed(1)} km/h`;
        document.getElementById('wind-direction').textContent = degreesToCardinal(current.wind_direction_10m);
        document.getElementById('rain-mm').textContent = `${current.rain.toFixed(1)} mm`;
        document.getElementById('precipitation-prob').textContent = `${daily.precipitation_probability_max[0]}%`;
        document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
        document.getElementById('pressure').textContent = `${Math.round(current.pressure_msl)} hPa`;
    };

    const updateHourlyForecast = ({ hourly }) => {
        const timeline = document.getElementById('hourly-timeline');
        timeline.innerHTML = '';
        const startIndex = new Date().getHours();
        for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
            const time = new Date(hourly.time[i]);
            const hour = time.toLocaleTimeString([], { hour: 'numeric' });
            const weatherInfo = getWeatherInfo(hourly.weather_code[i], hourly.is_day[i]);
            const itemHTML = `
                <div class="flex flex-col items-center gap-2 flex-shrink-0 bg-slate-800/50 p-4 rounded-2xl w-24">
                    <p class="text-slate-400 text-sm">${hour}</p>
                    <i class="fa-solid ${weatherInfo.icon} text-2xl text-cyan-300"></i>
                    <p class="font-bold text-xl">${Math.round(hourly.temperature_2m[i])}°</p>
                </div>`;
            timeline.innerHTML += itemHTML;
        }
    };

    const updateDailyForecast = ({ daily }) => {
        const container = document.getElementById('daily-forecast-container');
        container.innerHTML = '';
        for (let i = 0; i < daily.time.length; i++) {
            const date = new Date(daily.time[i]);
            const day = i === 0 ? 'Today' : date.toLocaleDateString([], { weekday: 'short' });
            const weatherInfo = getWeatherInfo(daily.weather_code[i]);
            const itemHTML = `
                <div class="grid grid-cols-3 items-center gap-4 text-slate-300">
                    <p class="font-medium">${day}</p>
                    <div class="flex items-center gap-4">
                        <i class="fa-solid ${weatherInfo.icon} text-cyan-300 text-xl"></i>
                        <span class="text-slate-400">${weatherInfo.desc}</span>
                    </div>
                    <p class="text-right font-medium">${Math.round(daily.temperature_2m_max[i])}° / <span class="text-slate-400">${Math.round(daily.temperature_2m_min[i])}°</span></p>
                </div>`;
            container.innerHTML += itemHTML;
        }
    };
    
    // --- API FETCHING & GEOLOCATION ---
    const fetchWeatherData = async (latitude, longitude) => {
        const params = "temperature_2m,relative_humidity_2m,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,rain,showers,snowfall,cloud_cover&hourly=temperature_2m,weather_code,is_day,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_probability_max";
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${params}&timezone=auto`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Weather data fetch failed');
            const data = await response.json();
            updateUI(data);
        } catch (error) { console.error("Error:", error); alert("Could not fetch weather data."); }
        finally { loader.style.display = 'none'; }
    };

    const handleSearch = async () => {
        const cityName = searchInput.value.trim();
        if (!cityName) return;
        loader.style.display = 'flex';
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
        try {
            const response = await fetch(geocodeUrl);
            if (!response.ok) throw new Error('Geocoding API failed');
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const { latitude, longitude, name, admin1, country } = data.results[0];
                document.getElementById('location').textContent = admin1 ? `${name}, ${admin1}` : `${name}, ${country}`;
                fetchWeatherData(latitude, longitude);
            } else { alert('City not found.'); loader.style.display = 'none'; }
        } catch (error) { console.error("Error:", error); alert("Could not find city."); loader.style.display = 'none'; }
    };
    
    const getLocation = () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                document.getElementById('location').textContent = 'Your Location';
                fetchWeatherData(latitude, longitude);
            },
            () => { 
                alert("Location access denied. Showing weather for Sri City.");
                document.getElementById('location').textContent = "Sri City, IN";
                fetchWeatherData(13.52, 79.99);
            }
        );
    };

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', (e) => e.key === 'Enter' && handleSearch());
    getLocation();
});