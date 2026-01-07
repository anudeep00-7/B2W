// civiceye.js - Complete Fixed JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });
    }

    // DOM Elements
    const loader = document.getElementById('loader');
    const appContainer = document.querySelector('.app-container');
    const landingPage = document.getElementById('landing-page');
    const loginModal = document.getElementById('login-modal');

    // API Keys
    const OPENWEATHER_API_KEY = '779b7dc10f0e3713d126315f51a871aa';
    const NEWSDATA_API_KEY = 'pub_1f05459b885f4a9cb8468b85f570f7a1';

    // Global State (Simulated Backend Data)
    let currentUser = null;
    let currentTheme = localStorage.getItem('theme') || 'dark';
    let map = null;
    let userLocation = { lat: 13.6333, lng: 79.4167 }; // Default to Tirupati
    let allReports = [
        { 
            id: 1, 
            title: "Canteen Idly Turns to Stone After 8:00 AM", 
            description: "Students report the breakfast delicacy achieving rock-like density as time passes.", 
            photo: "https://via.placeholder.com/150", 
            lat: 13.6212, 
            lng: 79.4150, 
            username: "user", 
            votes: 405, 
            status: "pending", 
            comments: [],
            category: "food",
            createdAt: new Date('2025-10-14T09:00:00Z').toISOString(),
            voters: []
        },
        { 
            id: 2, 
            title: "Wi-Fi Speed Drops When Faculty Walks By", 
            description: "Unexplained electromagnetic phenomena occur every time a lecturer passes the router.", 
            photo: "https://via.placeholder.com/150", 
            lat: 13.6190, 
            lng: 79.4121, 
            username: "user", 
            votes: 400, 
            status: "pending", 
            comments: [],
            category: "infrastructure",
            createdAt: new Date('2025-10-13T15:30:00Z').toISOString(),
            voters: []
        },
        // More sample reports can be added here
    ];
    let usersData = [
        { 
            username: 'user', 
            password: 'password', 
            role: 'user', 
            karma: 100
        },
        { 
            username: 'admin', 
            password: 'adminpassword', 
            role: 'admin', 
            karma: 999
        },
        { 
            username: 'TirupatiGreenFoundation', 
            password: 'ngo_password', 
            role: 'ngo'
        }
    ];
    let ngosData = [
        { 
            name: "Tirupati Green Foundation", 
            description: "A local NGO focused on tree plantation, waste segregation, and climate awareness.", 
            contact: "info@tirupatigreen.org", 
            contactPerson: "Suresh Reddy",
            username: "TirupatiGreenFoundation"
        }
    ];

    let uploadedPhotos = [];
    let userProfile = null;
    let addressMarker = null;
    let manualCoordinates = null;

    // Utility to generate unique ID
    const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

    // Initialize App
    async function initApp() {
        showLoader();
        setAppTheme(currentTheme);
        
        // Check if user was previously logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                await loginSuccess();
            } catch (error) {
                console.log('No saved login found');
                localStorage.removeItem('currentUser');
            }
        }
        
        setupEventListeners();
        getUserLocation();
        hideLoader();
    }

    // Setup Event Listeners
    function setupEventListeners() {
        // Landing page buttons
        document.getElementById('nav-login').addEventListener('click', showLoginModal);
        document.getElementById('nav-get-started').addEventListener('click', showLoginModal);
        document.getElementById('hero-report').addEventListener('click', showLoginModal);
        document.getElementById('hero-browse').addEventListener('click', () => {
            showLoginModal();
            localStorage.setItem('redirectAfterLogin', 'issues-view');
        });

        // Login modal
        document.getElementById('close-login').addEventListener('click', hideLoginModal);
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) hideLoginModal();
        });

        // Login forms
        document.getElementById('user-login-form').addEventListener('submit', handleUserLogin);
        document.getElementById('ngo-login-form').addEventListener('submit', handleNGOLogin);

        // Login tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                switchLoginTab(tab);
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

        // Report form
        document.getElementById('report-form').addEventListener('submit', handleReportSubmit);
        
        // Photo upload
        document.getElementById('upload-area').addEventListener('click', () => {
            document.getElementById('photo-input').click();
        });
        document.getElementById('photo-input').addEventListener('change', handlePhotoUpload);

        // News tabs
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('news-tab')) {
                const category = e.target.dataset.category;
                loadNews(category);
            }
            
            if (e.target.classList.contains('filter-btn')) {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                displayAllIssues();
            }

            if (e.target.classList.contains('admin-tab')) {
                const tab = e.target.dataset.tab;
                switchAdminTab(tab);
            }
        });

        // Sort select
        document.getElementById('sort-select').addEventListener('change', displayAllIssues);
    }

    // Login Functions
    function showLoginModal() {
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideLoginModal() {
        loginModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function switchLoginTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    async function handleUserLogin(e) {
        e.preventDefault();
        await performLogin('user');
    }

    async function handleNGOLogin(e) {
        e.preventDefault();
        await performLogin('ngo');
    }

    async function performLogin(role) {
        showLoader();
        
        const username = role === 'user' 
            ? document.getElementById('username-input').value
            : document.getElementById('ngo-username').value;
            
        const password = role === 'user'
            ? document.getElementById('password-input').value
            : document.getElementById('ngo-password').value;

        const user = usersData.find(u => u.username === username && u.password === password);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            await loginSuccess();
        } else {
            showNotification('Invalid credentials. Please try again.', 'error');
        }

        hideLoader();
    }

    async function loginSuccess() {
        hideLoginModal();
        landingPage.style.display = 'none';
        appContainer.style.display = 'block';
        
        // Load initial data
        allReports = getReportsFromLocalStorage();
        userProfile = getUserProfile(currentUser.username);
        
        // Update UI based on user role
        updateHeader();
        setupNavigation();
        updateDashboardStats();
        
        // Load weather and news
        loadWeather();
        loadNews('local');
        
        // Show appropriate view
        const redirectView = localStorage.getItem('redirectAfterLogin');
        if (redirectView) {
            showView(redirectView);
            localStorage.removeItem('redirectAfterLogin');
        } else {
            showView('dashboard-view');
        }

        // Initialize map if needed
        if (document.getElementById('issues-map')) {
            initializeMap();
        }
    }

    // In-memory "database" functions
    function getReportsFromLocalStorage() {
        const storedReports = localStorage.getItem('allReports');
        return storedReports ? JSON.parse(storedReports) : allReports;
    }
    
    function saveReportsToLocalStorage() {
        localStorage.setItem('allReports', JSON.stringify(allReports));
    }

    function getUserProfile(username) {
        const user = usersData.find(u => u.username === username);
        const userReports = allReports.filter(r => r.username === username);
        return {
            ...user,
            totalReports: userReports.length,
            resolvedReports: userReports.filter(r => r.status === 'resolved').length
        };
    }
    
    // Weather and News Functions - now direct API calls
    async function loadWeather() {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lng}&appid=${OPENWEATHER_API_KEY}&units=metric`);
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('weather-temp').textContent = `${Math.round(data.main.temp)}°C`;
                document.getElementById('weather-desc').textContent = data.weather[0].description;
                document.getElementById('weather-wind').textContent = `${data.wind.speed} m/s`;
                document.getElementById('weather-humidity').textContent = `${data.main.humidity}%`;
                const weatherIcon = document.getElementById('weather-icon');
                weatherIcon.textContent = getWeatherEmoji(data.weather[0].icon);
                document.querySelector('.weather-card h3').innerHTML = `<i class="fas fa-cloud-sun"></i> Weather in ${data.name}`;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading weather:', error);
            document.getElementById('weather-desc').textContent = 'Weather unavailable';
        }
    }

    function getWeatherEmoji(iconCode) {
        const emojiMap = {
            '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
            '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
            '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌦️',
            '11d': '⛈️', '11n': '⛈️', '13d': '🌨️', '13n': '🌨️',
            '50d': '🌫️', '50n': '🌫️'
        };
        return emojiMap[iconCode] || '🌤️';
    }

    async function loadNews(category) {
        try {
            let query = 'india';
            if (category === 'world') {
                query = 'world';
            }
            const response = await fetch(`https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${query}&language=en`);
            const data = await response.json();
            const newsContainer = document.getElementById('news-content');
            
            if (response.ok && data.results && data.results.length > 0) {
                const newsData = data.results.slice(0, 5).map(article => ({
                    title: article.title,
                    description: article.description || 'No description available',
                    source: article.source_id || 'Unknown Source',
                    publishedAt: article.pubDate,
                    url: article.link,
                    image: article.image_url
                }));
                
                newsContainer.innerHTML = newsData.map(news => `
                    <div class="news-item" onclick="window.open('${news.url || '#'}', '_blank')" style="cursor: pointer;">
                        ${news.image ? `<img src="${news.image}" alt="News image" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">` : ''}
                        <h4>${news.title || 'No title'}</h4>
                        <p>${news.description || 'No description available'}</p>
                        <div class="news-meta">
                            <span>${news.source || 'Unknown Source'}</span>
                            <span>•</span>
                            <span>${new Date(news.publishedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                newsContainer.innerHTML = '<p class="no-issues">No news available at the moment.</p>';
            }
            
            document.querySelectorAll('.news-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelector(`[data-category="${category}"]`).classList.add('active');
        } catch (error) {
            console.error('Error loading news:', error);
            document.getElementById('news-content').innerHTML = '<p class="no-issues">Failed to load news.</p>';
        }
    }

    // Navigation Functions
    function setupNavigation() {
        const mainNav = document.getElementById('main-nav');
        mainNav.innerHTML = '';
        const navItems = [
            { id: 'dashboard-nav', text: 'Dashboard', view: 'dashboard-view', icon: 'fas fa-home', roles: ['user', 'admin', 'ngo'] },
            { id: 'issues-nav', text: 'Issues', view: 'issues-view', icon: 'fas fa-list', roles: ['user', 'admin', 'ngo'] },
            { id: 'submit-nav', text: 'Report Issue', view: 'submit-view', icon: 'fas fa-plus', roles: ['user', 'admin'] }
        ];
        if (currentUser.role === 'user' || currentUser.role === 'admin') {
            navItems.push({ id: 'profile-nav', text: 'My Profile', view: 'profile-view', icon: 'fas fa-user', roles: ['user', 'admin'] });
        }
        if (currentUser.role === 'admin') {
            navItems.push({ id: 'admin-nav', text: 'Admin', view: 'admin-dashboard-view', icon: 'fas fa-cog', roles: ['admin'] });
        }
        if (currentUser.role === 'ngo') {
            navItems.push({ id: 'ngo-nav', text: 'NGO Dashboard', view: 'ngo-dashboard-view', icon: 'fas fa-hands-helping', roles: ['ngo'] });
        }
        navItems.filter(item => item.roles.includes(currentUser.role)).forEach(item => {
            const button = document.createElement('button');
            button.className = 'nav-item';
            button.type = 'button';
            button.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;
            button.addEventListener('click', () => showView(item.view));
            mainNav.appendChild(button);
        });
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'nav-item';
        logoutBtn.type = 'button';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.addEventListener('click', logout);
        mainNav.appendChild(logoutBtn);
    }

    function showView(viewId) {
        document.querySelectorAll('.view-container').forEach(view => view.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active');
        const navItem = document.querySelector(`[data-view="${viewId}"]`);
        if (navItem) navItem.classList.add('active');
        switch(viewId) {
            case 'dashboard-view':
                updateDashboardStats();
                displayRecentIssues();
                if (map) updateMapMarkers();
                break;
            case 'issues-view':
                displayAllIssues();
                break;
            case 'submit-view':
                initializeReportForm();
                break;
            case 'profile-view':
                displayProfile();
                break;
            case 'ngo-dashboard-view':
                displayNGODashboard();
                break;
            case 'admin-dashboard-view':
                displayAdminDashboard();
                break;
        }
    }
    window.showView = showView;

    function logout() {
        currentUser = null;
        uploadedPhotos = [];
        localStorage.removeItem('currentUser');
        localStorage.removeItem('redirectAfterLogin');
        appContainer.style.display = 'none';
        landingPage.style.display = 'block';
        document.querySelector('#main-nav').innerHTML = '';
        document.querySelector('#user-info').innerHTML = '';
        showNotification('You have been logged out.', 'info');
    }

    function setAppTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        currentTheme = theme;
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    function toggleTheme() {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setAppTheme(newTheme);
    }

    function updateHeader() {
        const userInfo = document.getElementById('user-info');
        if (currentUser) {
            userInfo.innerHTML = `
                <div class="user-avatar"><i class="fas fa-user"></i></div>
                <div class="user-details">
                    <div class="user-name">${currentUser.username}</div>
                    <div class="user-role">${currentUser.role.toUpperCase()}</div>
                    ${currentUser.karma ? `<div class="user-karma">Karma: ${currentUser.karma}</div>` : ''}
                </div>
            `;
        }
    }

    function updateDashboardStats() {
        const pendingCount = allReports.filter(r => r.status === 'pending').length;
        const progressCount = allReports.filter(r => r.status === 'inprogress').length;
        const resolvedCount = allReports.filter(r => r.status === 'resolved').length;
        document.getElementById('pending-count').textContent = pendingCount;
        document.getElementById('progress-count').textContent = progressCount;
        document.getElementById('resolved-count').textContent = resolvedCount;
    }

    function displayRecentIssues() {
        const container = document.getElementById('recent-issues-container');
        const recentIssues = [...allReports].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        if (recentIssues.length === 0) {
            container.innerHTML = '<p class="no-issues">No issues reported yet.</p>';
            return;
        }
        container.innerHTML = recentIssues.map(issue => {
            const hasVoted = issue.voters && issue.voters.includes(currentUser.username);
            return `
            <div class="issue-card">
                <div class="issue-header">
                    <h3 class="issue-title">${issue.title}</h3>
                    <span class="status-badge status-${issue.status}">${issue.status}</span>
                </div>
                <div class="issue-meta">
                    <span><i class="fas fa-user"></i> ${issue.username}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(issue.createdAt).toLocaleDateString()}</span>
                    <span><i class="fas fa-thumbs-up"></i> ${issue.votes} votes</span>
                </div>
                <p class="issue-description">${issue.description}</p>
                <div class="issue-actions">
                    <button type="button" class="vote-btn ${hasVoted ? 'active' : ''}" onclick="upvoteIssue(${issue.id}, event)">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${issue.votes}</span>
                    </button>
                    <button type="button" class="comment-btn" onclick="showComments(${issue.id}, event)">
                        <i class="fas fa-comment"></i>
                        <span>${issue.comments ? issue.comments.length : 0}</span>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    window.upvoteIssue = function(issueId, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (!currentUser) {
            showNotification('Please log in to vote.', 'error');
            return;
        }
        const issue = allReports.find(r => r.id === issueId);
        if (issue) {
            const userIndex = issue.voters.indexOf(currentUser.username);
            if (userIndex === -1) {
                issue.votes++;
                issue.voters.push(currentUser.username);
                currentUser.karma = (currentUser.karma || 0) + 1;
                showNotification('Vote recorded! +1 Karma', 'success');
            } else {
                issue.votes--;
                issue.voters.splice(userIndex, 1);
                currentUser.karma = (currentUser.karma || 0) - 1;
                showNotification('Vote removed!', 'info');
            }
            saveReportsToLocalStorage();
            refreshCurrentView();
        }
    };
    
    function displayAllIssues() {
        const sortBy = document.getElementById('sort-select').value;
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        let issues = [...allReports];
        if (activeFilter !== 'all') {
            issues = issues.filter(issue => issue.status === activeFilter);
        }
        if (sortBy === 'recent') {
            issues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'voted') {
            issues.sort((a, b) => b.votes - a.votes);
        }
        const container = document.getElementById('issues-feed-container');
        if (issues.length === 0) {
            container.innerHTML = '<p class="no-issues">No issues found.</p>';
            return;
        }
        container.innerHTML = issues.map(issue => {
            const hasVoted = issue.voters && issue.voters.includes(currentUser.username);
            return `
            <div class="issue-card">
                <div class="issue-header">
                    <h3 class="issue-title">${issue.title}</h3>
                    <span class="status-badge status-${issue.status}">${issue.status}</span>
                </div>
                <div class="issue-meta">
                    <span><i class="fas fa-user"></i> ${issue.username}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(issue.createdAt).toLocaleDateString()}</span>
                    <span><i class="fas fa-tag"></i> ${issue.category || 'General'}</span>
                </div>
                <p class="issue-description">${issue.description}</p>
                ${issue.photo && issue.photo !== 'https://via.placeholder.com/150' ? `<img src="${issue.photo}" alt="Issue photo" class="issue-image">` : ''}
                <div class="issue-actions">
                    <button type="button" class="vote-btn ${hasVoted ? 'active' : ''}" onclick="upvoteIssue(${issue.id}, event)">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${issue.votes}</span>
                    </button>
                    <button type="button" class="comment-btn" onclick="showComments(${issue.id}, event)">
                        <i class="fas fa-comment"></i>
                        <span>${issue.comments ? issue.comments.length : 0}</span>
                    </button>
                    ${currentUser.role === 'admin' ? `
                    <button type="button" class="btn-info" onclick="showAdminOptions(${issue.id}, event)">
                        <i class="fas fa-cog"></i>
                    </button>` : ''}
                </div>
            </div>
            `;
        }).join('');
    }

    function initializeMap() {
        if (!map && document.getElementById('issues-map')) {
            map = L.map('issues-map').setView([13.6333, 79.4167], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
            updateMapMarkers();
        }
    }

    function updateMapMarkers() {
        if (!map) return;
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
        allReports.forEach(report => {
            if (report.lat && report.lng) {
                const markerColor = getMarkerColor(report.status);
                const customIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">!</div>`,
                    iconSize: [30, 42],
                    iconAnchor: [15, 42],
                });
                L.marker([report.lat, report.lng], { icon: customIcon }).addTo(map).bindPopup(`<b>${report.title}</b><br>${report.description}<br>Status: <span class="status-${report.status}">${report.status}</span>`);
            }
        });
    }

    function getMarkerColor(status) {
        switch (status) {
            case 'pending': return '#ef4444';
            case 'inprogress': return '#f59e0b';
            case 'resolved': return '#10b981';
            default: return '#64748b';
        }
    }

    function initializeReportForm() {
        document.getElementById('report-form').reset();
        document.getElementById('photo-preview').innerHTML = '';
        uploadedPhotos = [];
        initializeLocationMap();
        document.getElementById('location-text').textContent = 'Enter address and click "Search Location"';
        manualCoordinates = null;
    }

    function initializeLocationMap() {
        const mapElement = document.getElementById('location-map-preview');
        if (!mapElement) return;
        mapElement.innerHTML = '';
        const locationMap = L.map('location-map-preview').setView([13.6333, 79.4167], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(locationMap);
        const addressInput = document.createElement('input');
        addressInput.type = 'text';
        addressInput.placeholder = 'Enter address...';
        addressInput.className = 'address-search-input';
        const searchButton = document.createElement('button');
        searchButton.textContent = 'Search';
        searchButton.type = 'button';
        searchButton.className = 'address-search-button';
        mapElement.appendChild(addressInput);
        mapElement.appendChild(searchButton);
        searchButton.addEventListener('click', (e) => { e.preventDefault(); searchAddress(addressInput.value, locationMap); });
        addressInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchAddress(addressInput.value, locationMap); } });
        locationMap.on('click', (e) => { setManualLocation(e.latlng.lat, e.latlng.lng, locationMap); });
        window.locationMap = locationMap;
    }

    async function searchAddress(address, map) {
        if (!address.trim()) { showNotification('Please enter an address', 'error'); return; }
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                map.setView([lat, lng], 15);
                setManualLocation(lat, lng, map);
                document.getElementById('location-text').textContent = `Location: ${data[0].display_name}`;
            } else {
                showNotification('Address not found. Please try a different address.', 'error');
            }
        } catch (error) {
            console.error('Address search error:', error);
            showNotification('Error searching address. Please try again.', 'error');
        }
    }

    function setManualLocation(lat, lng, map) {
        if (addressMarker) map.removeLayer(addressMarker);
        addressMarker = L.marker([lat, lng]).addTo(map).bindPopup('Selected Location').openPopup();
        manualCoordinates = { lat, lng };
        document.getElementById('location-text').textContent = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    function handlePhotoUpload(e) {
        const files = e.target.files;
        const preview = document.getElementById('photo-preview');
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedPhotos.push(e.target.result);
                    preview.innerHTML += `<img src="${e.target.result}" alt="Uploaded photo">`;
                };
                reader.readAsDataURL(file);
            }
        }
    }

    async function handleReportSubmit(e) {
        e.preventDefault();
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        if (!validateReportForm()) return;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
        try {
            const reportData = {
                id: generateId(),
                title: document.getElementById('title-input').value.trim(),
                description: document.getElementById('description-input').value.trim(),
                category: document.getElementById('category-select').value,
                lat: manualCoordinates.lat,
                lng: manualCoordinates.lng,
                username: currentUser.username,
                votes: 0,
                status: "pending",
                comments: [],
                createdAt: new Date().toISOString(),
                photo: uploadedPhotos[0] || 'https://via.placeholder.com/150',
                voters: [],
                address: document.getElementById('location-text').textContent.replace('Location: ', '')
            };
            allReports.unshift(reportData);
            saveReportsToLocalStorage();
            showNotification('Report submitted successfully!', 'success');
            document.getElementById('report-form').reset();
            document.getElementById('photo-preview').innerHTML = '';
            uploadedPhotos = [];
            manualCoordinates = null;
            showView('dashboard-view');
            updateDashboardStats();
            displayRecentIssues();
        } catch (error) {
            console.error('Report submission error:', error);
            showNotification('Error submitting report. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    function validateReportForm() {
        const title = document.getElementById('title-input').value.trim();
        const description = document.getElementById('description-input').value.trim();
        const category = document.getElementById('category-select').value;
        if (!title) { showNotification('Please enter a title for the issue.', 'error'); return false; }
        if (!description) { showNotification('Please describe the issue.', 'error'); return false; }
        if (!category) { showNotification('Please select a category.', 'error'); return false; }
        if (!manualCoordinates || !manualCoordinates.lat || !manualCoordinates.lng) { showNotification('Please select a location on the map.', 'error'); return false; }
        return true;
    }

    function displayProfile() {
        userProfile = getUserProfile(currentUser.username);
        if (!userProfile) return;
        document.getElementById('profile-username').textContent = userProfile.username;
        document.getElementById('profile-role').textContent = userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
        document.getElementById('profile-karma').textContent = userProfile.karma || 0;
        document.getElementById('profile-reports').textContent = userProfile.totalReports || 0;
        document.getElementById('profile-resolved').textContent = userProfile.resolvedReports || 0;
        displayUserReports();
    }

    async function displayUserReports() {
        const userReports = allReports.filter(r => r.username === currentUser.username);
        const container = document.getElementById('user-reports-container');
        if (userReports.length === 0) {
            container.innerHTML = '<p class="no-issues">You haven\'t submitted any reports yet.</p>';
            return;
        }
        container.innerHTML = userReports.map(issue => `
            <div class="issue-card">
                <div class="issue-header">
                    <h3 class="issue-title">${issue.title}</h3>
                    <span class="status-badge status-${issue.status}">${issue.status}</span>
                </div>
                <div class="issue-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(issue.createdAt).toLocaleDateString()}</span>
                    <span><i class="fas fa-thumbs-up"></i> ${issue.votes} votes</span>
                    <span><i class="fas fa-comments"></i> ${issue.comments ? issue.comments.length : 0} comments</span>
                </div>
                <p class="issue-description">${issue.description}</p>
                ${issue.assignedToNgo ? `<div class="issue-meta"><i class="fas fa-hands-helping"></i>Assigned to: ${issue.assignedToNgo}</div>` : ''}
            </div>
        `).join('');
    }

    function displayNGODashboard() {
        const ngoReports = allReports.filter(r => r.assignedToNgo === currentUser.username);
        document.getElementById('assigned-count').textContent = ngoReports.length;
        document.getElementById('ngo-progress-count').textContent = ngoReports.filter(r => r.status === 'inprogress').length;
        document.getElementById('ngo-resolved-count').textContent = ngoReports.filter(r => r.status === 'resolved').length;
        const container = document.getElementById('ngo-issues-container');
        if (ngoReports.length === 0) {
            container.innerHTML = '<p class="no-issues">No issues assigned to your NGO yet.</p>';
            return;
        }
        container.innerHTML = ngoReports.map(issue => `
            <div class="issue-card">
                <div class="issue-header">
                    <h3 class="issue-title">${issue.title}</h3>
                    <span class="status-badge status-${issue.status}">${issue.status}</span>
                </div>
                <div class="issue-meta">
                    <span><i class="fas fa-user"></i> ${issue.username}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(issue.createdAt).toLocaleDateString()}</span>
                    <span><i class="fas fa-thumbs-up"></i> ${issue.votes} votes</span>
                </div>
                <p class="issue-description">${issue.description}</p>
                ${issue.photo && issue.photo !== 'https://via.placeholder.com/150' ? `<img src="${issue.photo}" alt="Issue photo" class="issue-image">` : ''}
                <div class="issue-actions">
                    <div class="admin-actions">
                        ${issue.status !== 'resolved' ? `
                        <button type="button" class="btn-warning" onclick="updateIssueStatus(${issue.id}, 'inprogress')">Mark In Progress</button>
                        <button type="button" class="btn-info" onclick="updateIssueStatus(${issue.id}, 'resolved')">Mark Resolved</button>` : `
                        <button type="button" class="btn-warning" onclick="updateIssueStatus(${issue.id}, 'inprogress')">Reopen Issue</button>`}
                    </div>
                </div>
            </div>
        `).join('');
    }

    function displayAdminDashboard() {
        displayAdminIssues();
        displayNGOsList();
    }

    function switchAdminTab(tab) {
        document.querySelectorAll('.admin-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-section`).classList.add('active');
    }

    function displayAdminIssues() {
        const container = document.getElementById('admin-issues-container');
        const issues = [...allReports].sort((a,b) => b.id - a.id);
        if (issues.length === 0) {
            container.innerHTML = '<p class="no-issues">No issues to moderate.</p>';
            return;
        }
        const ngos = ngosData;
        container.innerHTML = issues.map(issue => `
            <div class="issue-card">
                <div class="issue-header">
                    <h3 class="issue-title">${issue.title}</h3>
                    <span class="status-badge status-${issue.status}">${issue.status}</span>
                </div>
                <div class="issue-meta">
                    <span>By: ${issue.username}</span>
                    <span>Votes: ${issue.votes}</span>
                    <span>Date: ${new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
                <p class="issue-description">${issue.description}</p>
                ${issue.photo && issue.photo !== 'https://via.placeholder.com/150' ? `<img src="${issue.photo}" alt="Issue photo" class="issue-image">` : ''}
                <div class="admin-actions">
                    <select class="ngo-assign-select" onchange="assignToNGO(${issue.id}, this.value)">
                        <option value="">Assign to NGO...</option>
                        ${ngos.map(ngo => `<option value="${ngo.username}" ${issue.assignedToNgo === ngo.username ? 'selected' : ''}>${ngo.name}</option>`).join('')}
                    </select>
                    <button type="button" class="btn-danger" onclick="deleteReport(${issue.id})"><i class="fas fa-trash"></i> Delete</button>
                    <button type="button" class="btn-warning" onclick="updateIssueStatus(${issue.id}, '${issue.status === 'resolved' ? 'pending' : 'resolved'}')">${issue.status === 'resolved' ? 'Reopen' : 'Resolve'}</button>
                    <button type="button" class="btn-info" onclick="shareOnTwitter(${issue.id})"><i class="fab fa-twitter"></i> Share</button>
                </div>
            </div>
        `).join('');
    }

    function displayNGOsList() {
        const container = document.getElementById('ngos-list-container');
        const ngos = ngosData;
        if (ngos.length === 0) {
            container.innerHTML = '<p class="no-issues">No NGOs registered.</p>';
            return;
        }
        container.innerHTML = ngos.map(ngo => `
            <div class="issue-card">
                <h3>${ngo.name}</h3>
                <p><strong>Contact:</strong> ${ngo.contact}</p>
                <p><strong>Description:</strong> ${ngo.description}</p>
                <p><strong>Contact Person:</strong> ${ngo.contactPerson}</p>
            </div>
        `).join('');
    }

    window.assignToNGO = function(issueId, ngoUsername) {
        const issue = allReports.find(r => r.id === issueId);
        if (issue) {
            issue.assignedToNgo = ngoUsername;
            issue.status = 'inprogress';
            saveReportsToLocalStorage();
            showNotification(`Issue assigned to ${ngoUsername}`, 'success');
            displayAdminIssues();
        }
    };

    window.deleteReport = function(issueId) {
        if (!confirm('Are you sure you want to delete this report?')) return;
        allReports = allReports.filter(r => r.id !== issueId);
        saveReportsToLocalStorage();
        showNotification('Report deleted successfully', 'success');
        displayAdminIssues();
    };

    window.updateIssueStatus = function(issueId, status) {
        const issue = allReports.find(r => r.id === issueId);
        if (issue) {
            issue.status = status;
            saveReportsToLocalStorage();
            showNotification(`Issue status updated to ${status}`, 'success');
            if (currentUser.role === 'admin') {
                displayAdminIssues();
            } else if (currentUser.role === 'ngo') {
                displayNGODashboard();
            }
        }
    };

    window.shareOnTwitter = function(issueId) {
        const issue = allReports.find(r => r.id === issueId);
        if (issue) {
            const text = `Check out this community issue on CivicEye: "${issue.title}" - Status: ${issue.status}`;
            const url = window.location.href;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            window.open(twitterUrl, '_blank');
        }
    };

    function showLoader() { if (loader) loader.classList.remove('hidden'); }
    function hideLoader() { if (loader) loader.classList.add('hidden'); }
    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                userLocation.lat = position.coords.latitude;
                userLocation.lng = position.coords.longitude;
                const locationText = document.getElementById('location-text');
                if (locationText) locationText.textContent = `Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
            }, error => {
                console.error('Geolocation error:', error);
                const locationText = document.getElementById('location-text');
                if (locationText) locationText.textContent = 'Location access denied. Please enable location services.';
            });
        }
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i> ${message}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function refreshCurrentView() {
        const activeView = document.querySelector('.view-container.active');
        if (activeView) {
            const viewId = activeView.id;
            showView(viewId);
        }
    }
    
    window.showComments = function() { showNotification('Comments feature coming soon!', 'info'); }
    window.showAdminOptions = function() { showNotification('Admin options feature coming soon!', 'info'); }

    initApp();
});