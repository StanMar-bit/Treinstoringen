/**
 * Treinstoringen Dashboard Script
 * 
 * This script handles functionality for the train disruptions dashboard:
 * - Chart visualizations (monthly disruptions, causes breakdown, causes per month)
 * - Map visualization of railway disruptions
 * - Year selection functionality
 * - Dark mode toggle
 * 
 * The dashboard uses Chart.js for data visualization and Leaflet.js for map rendering.
 */

// ===============================================================
// INITIALIZATION - Wait for DOM to load before executing
// ===============================================================
document.addEventListener("DOMContentLoaded", function() {
    // ============= DOM ELEMENT SELECTORS =============
    // Connect to important DOM elements that we'll need to reference
    const body = document.body;
    const monthlyChart = document.getElementById('monthlyChart');
    const causesChart = document.getElementById('causesChart');
    const causesPerMonthChart = document.getElementById('causesPerMonthChart');
    const mapContainer = document.getElementById('mapContainer');
    const yearSelector = document.getElementById('yearSelector');
    const darkModeButton = document.getElementById('darkModeButton');
    
    // ============= APPLICATION STATE =============
    // Variables to maintain application state
    let currentYear = "2024"; // Default year for data display
    let map = null;          // Map variable for Leaflet - initialized when needed
    let isDarkMode = false;  // Track dark mode state
    
    // Get theme colors from CSS variables for consistent styling
    const style = getComputedStyle(document.documentElement);
    const blauwColor = style.getPropertyValue('--blauw');

    // ============= CHART CONFIGURATION =============
    /**
     * Default chart options shared across visualizations
     * Sets reasonable defaults for responsiveness, scales, and appearance
     * @returns {Object} Default chart configuration
     */
    function getDefaultChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10,
                        color: '#39394D'
                    },
                    grid: {
                        color: '#E6E6E9'
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45,
                        color: '#39394D'
                    },
                    grid: {
                        color: '#E6E6E9'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#39394D'
                    }
                }
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 20,
                    bottom: 30
                }
            }
        };
    }

    // ============= CHART INITIALIZATION =============
    // Create and configure all chart instances with empty data
    // Data will be populated when loadData functions are called
    const charts = {
        // Monthly disruptions bar chart
        monthly: new Chart(monthlyChart, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Aantal storingen',
                    data: [],
                    borderWidth: 1,
                    backgroundColor: blauwColor,
                    borderColor: blauwColor
                }]
            },
            options: getDefaultChartOptions()
        }),
        
        // Causes pie chart - show distribution of disruption causes
        causes: new Chart(causesChart, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    label: 'Aantal storingen per oorzaak',
                    data: [],
                    backgroundColor: [
                        '#003082', // Main blue
                        '#FFC917', // Main yellow
                        '#E6E6E9', // Main grey
                        '#4D79B3', // Lighter blue
                        '#FFE066', // Lighter yellow
                        '#999999', // Darker grey
                        '#001F52', // Darker blue
                        '#CC9900'  // Darker yellow
                    ]
                }]
            },
            options: {
                ...getDefaultChartOptions(),
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { display: false }, y: { display: false } },
                plugins: {
                    legend: {
                        position: 'right',
                        align: 'center',
                        labels: {
                            boxWidth: 15,
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        }),
        
        // Causes per month line chart - showing trends over time
        causesPerMonth: new Chart(causesPerMonthChart, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: getDefaultChartOptions()
        })
    };

    // ============= UTILITY FUNCTIONS =============
    /**
     * Ensures charts are visible and the map is hidden
     * Used when switching between visualization types
     */
    function showChart() {
        // Get all chart canvases
        const chartCanvases = document.querySelectorAll('canvas');
        chartCanvases.forEach(canvas => {
            canvas.style.display = 'block';
        });
        
        // Hide map container if it exists
        if (mapContainer) {
            mapContainer.style.display = 'none';
        }
    }
    
    /**
     * Shared error handling for chart data loading failures
     * Clears charts and displays empty state
     * @param {Error} error - The error that occurred
     */
    function handleChartError(error) {
        console.error("Error loading data:", error);
        
        // Reset chart to empty state
        Object.values(charts).forEach(chart => {
            chart.data.labels = [];
            chart.data.datasets = [{
                label: 'Geen data beschikbaar',
                data: [],
                backgroundColor: blauwColor,
                borderColor: blauwColor
            }];
            chart.update();
        });
    }

    /**
     * Update all chart visualizations based on current year selection
     * Central function to refresh all data displays
     */
    function updateAllCharts() {
        loadMonthlyDisruptions();
        loadDisruptionCauses();
        loadCausesPerMonth();
        loadRailwayMap();
    }

    // ============= DARK MODE FUNCTIONALITY =============
    /**
     * Detects if user's system prefers dark mode
     * Used for initial setup and system preference changes
     * @returns {boolean} True if system prefers dark mode
     */
    function systemPrefersDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    /**
     * Sets up listener for system color scheme preference changes
     * Will automatically switch theme if user hasn't manually set preference
     */
    function setupColorSchemeListener() {
        if (window.matchMedia) {
            const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Use addEventListener for all modern browsers
            try {
                colorSchemeQuery.addEventListener('change', function(e) {
                    // Only auto-switch if user hasn't manually toggled
                    if (!localStorage.getItem('darkModeManuallySet')) {
                        setDarkMode(e.matches);
                    }
                });
            } catch (e) {
                // Fallback for older browsers without triggering deprecation warning
                if (typeof colorSchemeQuery.onchange !== 'undefined') {
                    colorSchemeQuery.onchange = function(e) {
                        if (!localStorage.getItem('darkModeManuallySet')) {
                            setDarkMode(e.matches);
                        }
                    };
                }
            }
        }
    }
    
    /**
     * Applies dark mode setting to the entire application
     * Updates UI elements, chart colors, and map appearance
     * @param {boolean} enableDark - Whether to enable or disable dark mode
     */
    function setDarkMode(enableDark) {
        isDarkMode = enableDark;
        
        // Apply or remove dark mode class
        if (isDarkMode) {
            body.classList.add('dark-mode');
            darkModeButton.textContent = '☀️ Light Mode';
        } else {
            body.classList.remove('dark-mode');
            darkModeButton.textContent = '🌙 Dark Mode';
        }
        
        // Update chart colors
        updateChartColors();
        
        // Update map if it exists
        updateMapStyle();
    }
    
    /**
     * Updates chart colors based on current theme
     * Ensures all charts use appropriate colors for current mode
     */
    function updateChartColors() {
        const textColor = isDarkMode ? '#ffffff' : '#39394D';
        const gridColor = isDarkMode ? '#404040' : '#E6E6E9';
        const backgroundColor = isDarkMode ? '#2d2d2d' : '#ffffff';
        
        // Update each chart's colors
        Object.values(charts).forEach(chart => {
            if (chart.canvas) { // Skip map
                chart.canvas.style.backgroundColor = backgroundColor;
                chart.options.plugins.legend.labels.color = textColor;
                if (chart.options.scales.x) {
                    chart.options.scales.x.ticks.color = textColor;
                    chart.options.scales.x.grid.color = gridColor;
                }
                if (chart.options.scales.y) {
                    chart.options.scales.y.ticks.color = textColor;
                    chart.options.scales.y.grid.color = gridColor;
                }
                chart.update();
            }
        });
    }
    
    /**
     * Updates map style based on current theme
     * Changes the map tile layer for dark/light modes
     */
    function updateMapStyle() {
        if (map) {
            const tileLayer = isDarkMode ? 
                'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            
            map.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                    map.removeLayer(layer);
                }
            });
            
            L.tileLayer(tileLayer, {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
        }
    }
    
    /**
     * Toggles dark mode on user request
     * Stores preference in localStorage so it persists between visits
     */
    function toggleDarkMode() {
        // User has manually set preference
        localStorage.setItem('darkModeManuallySet', 'true');
        localStorage.setItem('darkModeEnabled', !isDarkMode);
        
        // Toggle dark mode
        setDarkMode(!isDarkMode);
    }

    // ============= DATA LOADING FUNCTIONS =============
    /**
     * Loads monthly disruption data and updates bar chart
     * Fetches disruption data for the selected year and displays counts by month
     */
    async function loadMonthlyDisruptions() {
        try {
            const response = await fetch(`./Data/disruptions-${currentYear}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Dutch month names for x-axis labels
            const monthNames = {
                '01': 'Januari', '02': 'Februari', '03': 'Maart', '04': 'April',
                '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Augustus',
                '09': 'September', '10': 'Oktober', '11': 'November', '12': 'December'
            };

            // Process data - count disruptions per month
            const monthlyCounts = {};
            data.forEach(item => {
                const date = new Date(item.start_time);
                const monthNum = String(date.getMonth() + 1).padStart(2, '0');
                const monthName = monthNames[monthNum];
                monthlyCounts[monthName] = (monthlyCounts[monthName] || 0) + 1;
            });

            // Generate labels and dataset
            const labels = Object.keys(monthlyCounts);
            const values = labels.map(month => monthlyCounts[month]);

            // Update chart with new data
            charts.monthly.config.type = 'bar';
            charts.monthly.data.labels = labels;
            charts.monthly.data.datasets = [{
                label: 'Aantal storingen per maand',
                data: values,
                borderWidth: 1,
                backgroundColor: blauwColor,
                borderColor: blauwColor
            }];

            // Configure chart options
            charts.monthly.options.scales.y.display = true;
            charts.monthly.options.scales.x.display = true;
            
            charts.monthly.update();

        } catch (error) {
            handleChartError(error);
        }
    }

    /**
     * Loads disruption causes data and updates pie chart
     * Shows breakdown of disruption causes as pie segments
     */
    async function loadDisruptionCauses() {
        try {
            const response = await fetch(`./Data/disruptions-${currentYear}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Translations for cause groups - English to Dutch
            const causeTranslations = {
                'staff': 'Personeel',
                'external': 'Externe factoren',
                'infrastructure': 'Infrastructuur',
                'rolling stock': 'Materieel',
                'weather': 'Weer',
                'accidents': 'Ongelukken',
                'logistical': 'Logistiek',
                'engineering work': 'Technisch werk',
                'unknown': 'Onbekend'
            };

            // Group and count by cause type
            const causeCounts = {};
            data.forEach(item => {
                const cause = item.cause_group || "unknown";
                const translatedCause = causeTranslations[cause] || cause;
                causeCounts[translatedCause] = (causeCounts[translatedCause] || 0) + 1;
            });

            // Generate labels and dataset
            const labels = Object.keys(causeCounts);
            const values = labels.map(cause => causeCounts[cause]);

            // Update chart with new data
            charts.causes.config.type = 'pie';
            charts.causes.data.labels = labels;
            charts.causes.data.datasets = [{
                label: 'Aantal storingen per oorzaak',
                data: values,
                backgroundColor: [
                    '#003082',  // Main blue
                    '#FFC917',  // Main yellow
                    '#E6E6E9',  // Main grey
                    '#4D79B3',  // Lighter blue
                    '#FFE066',  // Lighter yellow
                    '#999999',  // Darker grey
                    '#001F52',  // Darker blue
                    '#CC9900',  // Darker yellow
                ]
            }];
            
            // Configure chart options
            charts.causes.options.scales.y.display = false;
            charts.causes.options.scales.x.display = false;

            charts.causes.update();

        } catch (error) {
            handleChartError(error);
        }
    }

    /**
     * Loads causes per month data and updates line chart
     * Shows trends of different disruption causes over months
     */
    async function loadCausesPerMonth() {
        try {
            const response = await fetch(`./Data/disruptions-${currentYear}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Translations for cause groups - English to Dutch
            const causeTranslations = {
                'staff': 'Personeel',
                'external': 'Externe factoren',
                'infrastructure': 'Infrastructuur',
                'rolling stock': 'Materieel',
                'weather': 'Weer',
                'accidents': 'Ongelukken',
                'logistical': 'Logistiek',
                'engineering work': 'Technisch werk',
                'unknown': 'Onbekend'
            };

            // Dutch month names for x-axis
            const monthNames = {
                '01': 'Jan', '02': 'Feb', '03': 'Mrt', '04': 'Apr',
                '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Aug',
                '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Dec'
            };

            // Prepare all months of the year in order with abbreviated names for mobile
            const allMonths = Object.values(monthNames);
            
            // Group by cause and month - create matrix of cause x month
            const causesPerMonth = {};
            
            data.forEach(item => {
                const date = new Date(item.start_time);
                const monthNum = String(date.getMonth() + 1).padStart(2, '0');
                const monthName = monthNames[monthNum];
                
                const cause = item.cause_group || "unknown";
                const translatedCause = causeTranslations[cause] || cause;
                
                // Initialize cause if it doesn't exist
                if (!causesPerMonth[translatedCause]) {
                    causesPerMonth[translatedCause] = {};
                    allMonths.forEach(month => {
                        causesPerMonth[translatedCause][month] = 0;
                    });
                }
                
                // Count disruption for this cause and month
                causesPerMonth[translatedCause][monthName] = (causesPerMonth[translatedCause][monthName] || 0) + 1;
            });

            // Get causes sorted by total disruptions to identify top causes
            const causeSums = {};
            for (const cause in causesPerMonth) {
                causeSums[cause] = Object.values(causesPerMonth[cause]).reduce((sum, count) => sum + count, 0);
            }
            
            // Sort causes by total disruptions
            const sortedCauses = Object.keys(causeSums).sort((a, b) => causeSums[b] - causeSums[a]);
            
            // Create datasets for the chart - one line per cause
            // Limit to 5 most common causes for better readability on mobile
            const datasets = [];
            const colors = [
                '#003082', '#FFC917', '#E6E6E9', '#4D79B3', 
                '#FFE066', '#999999', '#001F52', '#CC9900', 
                '#5D8AA8', '#A52A2A'
            ];

            // Create dataset for top causes only - improves mobile readability
            let colorIndex = 0;
            const isMobile = window.innerWidth < 768;
            const displayLimit = isMobile ? 5 : 8; // Show fewer on mobile
            
            for (let i = 0; i < Math.min(displayLimit, sortedCauses.length); i++) {
                const cause = sortedCauses[i];
                const values = allMonths.map(month => causesPerMonth[cause][month]);
                
                datasets.push({
                    label: cause,
                    data: values,
                    borderColor: colors[colorIndex % colors.length],
                    backgroundColor: colors[colorIndex % colors.length] + '33', // transparent version
                    borderWidth: 2,
                    tension: 0.2,  // slightly curved lines
                    fill: false
                });
                
                colorIndex++;
            }

            // Update chart with new data
            charts.causesPerMonth.config.type = 'line';
            charts.causesPerMonth.data.labels = allMonths;
            charts.causesPerMonth.data.datasets = datasets;
            
            // Configure chart options
            charts.causesPerMonth.options.scales.y.display = true;
            charts.causesPerMonth.options.scales.x.display = true;
            
            // Mobile optimizations for x-axis
            if (isMobile) {
                charts.causesPerMonth.options.scales.x.ticks = {
                    maxRotation: 0,  // No rotation on mobile
                    minRotation: 0,  // No rotation on mobile
                    autoSkip: false,
                    font: {
                        size: 9  // Smaller font size
                    },
                    color: isDarkMode ? '#ffffff' : '#39394D'
                };
            } else {
                charts.causesPerMonth.options.scales.x.ticks = {
                    maxRotation: 45,
                    minRotation: 45,
                    autoSkip: false,
                    color: isDarkMode ? '#ffffff' : '#39394D'
                };
            }
            
            charts.causesPerMonth.options.plugins.legend.display = true;
            
            // Mobile optimized legends
            if (isMobile) {
                charts.causesPerMonth.options.plugins.legend.position = 'bottom';
                charts.causesPerMonth.options.plugins.legend.labels.boxWidth = 10;
                charts.causesPerMonth.options.plugins.legend.labels.font = {
                    size: 10
                };
            } else {
                charts.causesPerMonth.options.plugins.legend.position = 'top';
                charts.causesPerMonth.options.plugins.legend.labels.boxWidth = 15;
                charts.causesPerMonth.options.plugins.legend.labels.font = {
                    size: 11
                };
            }
            
            charts.causesPerMonth.update();

        } catch (error) {
            handleChartError(error);
        }
    }

    /**
     * Loads railway map showing disruptions
     * Displays geographical visualization of railway disruptions on a map
     */
    async function loadRailwayMap() {
        try {
            // Show map container
            if (mapContainer) {
                mapContainer.style.display = 'block';
            }

            // Fetch railway data from JSON file
            try {
                const response = await fetch(`./Data/train-map.json`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const trackData = await response.json();

                // Initialize map if not already initialized
                if (!map) {
                    // Create map centered on Netherlands
                    map = L.map('mapContainer').setView([52.1326, 5.2913], 7);
                    
                    // Add tile layer based on current theme
                    const tileLayer = isDarkMode ? 
                        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
                        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                    
                    L.tileLayer(tileLayer, {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(map);
                }
                
                // Clear existing layers (tracks) except base tile layer
                map.eachLayer((layer) => {
                    if (!(layer instanceof L.TileLayer)) {
                        map.removeLayer(layer);
                    }
                });

                // Find maximum disruptions for color scaling
                const maxDisruptions = Math.max(...trackData.map(track => track.disruptions || 0));

                // Add tracks to map
                trackData.forEach(track => {
                    // Skip entries without coordinates or with only one coordinate
                    if (!track.coords || track.coords.length <= 1) return;
                    
                    // Calculate color based on disruption count
                    // Color intensity increases with disruption frequency
                    const disruptions = track.disruptions || 0;
                    const percentage = maxDisruptions > 0 ? disruptions / maxDisruptions : 0;
                    const color = percentage > 0.75 ? '#b10026' :   // Highest (red)
                                percentage > 0.5 ? '#fc4e2a' :     // High (orange-red)
                                percentage > 0.25 ? '#feb24c' :    // Medium (orange)
                                percentage > 0 ? '#ffeda0' :       // Low (yellow)
                                '#cccccc';                        // None (grey)

                    // Create popup content with track info
                    const popupContent = `
                        <b>${track.name}</b><br>
                        Aantal storingen: ${disruptions}
                    `;

                    // Add track to map as polyline
                    L.polyline(track.coords, {
                        color: color,
                        weight: 3,
                        opacity: 0.8
                    })
                    .bindPopup(popupContent)
                    .addTo(map);
                });

                // Add station markers for single coordinates (stations)
                trackData.forEach(track => {
                    if (track.coords && track.coords.length === 1) {
                        L.circle(track.coords[0], {
                            color: '#003082',
                            fillColor: '#003082',
                            fillOpacity: 0.8,
                            radius: 300
                        })
                        .bindPopup(`<b>${track.name}</b><br>Aantal storingen: ${track.disruptions || 0}`)
                        .addTo(map);
                    }
                });

                // Ensure map renders correctly
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
                
            } catch (error) {
                console.error("Fout bij laden van kaartdata:", error);
                
                // Create sample data for demo purposes if file is not found
                const demoTracks = [
                    {
                        name: "Amsterdam - Utrecht",
                        disruptions: 25,
                        coords: [[52.3791, 4.9003], [52.2569, 4.9925], [52.0894, 5.1142]]
                    },
                    {
                        name: "Rotterdam - Den Haag",
                        disruptions: 15,
                        coords: [[51.9244, 4.4777], [52.0705, 4.3007]]
                    },
                    {
                        name: "Eindhoven - Tilburg",
                        disruptions: 5,
                        coords: [[51.4426, 5.4777], [51.5605, 5.0836]]
                    }
                ];
                
                // Initialize map with demo data if needed
                if (!map) {
                    map = L.map('mapContainer').setView([52.1326, 5.2913], 7);
                    
                    // Add tile layer based on current theme
                    const tileLayer = isDarkMode ? 
                        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
                        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                    
                    L.tileLayer(tileLayer, {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(map);
                }
                
                // Clear existing layers except the tile layer
                map.eachLayer((layer) => {
                    if (!(layer instanceof L.TileLayer)) {
                        map.removeLayer(layer);
                    }
                });

                // Add demo tracks to map
                demoTracks.forEach(track => {
                    // Calculate color based on disruption count
                    const color = track.disruptions > 20 ? '#b10026' :    // Highest
                                track.disruptions > 10 ? '#fc4e2a' :      // High
                                track.disruptions > 5 ? '#feb24c' :       // Medium
                                '#ffeda0';                              // Low

                    // Add track to map
                    L.polyline(track.coords, {
                        color: color,
                        weight: 3,
                        opacity: 0.8
                    })
                    .bindPopup(`<b>${track.name}</b><br>Aantal storingen: ${track.disruptions}`)
                    .addTo(map);
                });
                
                // Add message to indicate demo data is being used
                const errorMessage = document.createElement('div');
                errorMessage.className = 'map-error-message';
                errorMessage.innerHTML = `
                    <p>Kaartdata kon niet worden geladen. Tonen van voorbeeldgegevens...</p>
                `;
                mapContainer.appendChild(errorMessage);
                
                // Make sure the message is positioned correctly
                errorMessage.style.position = 'absolute';
                errorMessage.style.bottom = '10px';
                errorMessage.style.right = '10px';
                errorMessage.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                errorMessage.style.padding = '5px 10px';
                errorMessage.style.borderRadius = '5px';
                errorMessage.style.zIndex = '1000';
                
                // Ensure map renders correctly
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }

        } catch (error) {
            console.error("Fout bij laden van kaart:", error);
            
            // Create placeholder message in map container when initialization fails
            if (mapContainer) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'map-error-message';
                errorMessage.innerHTML = `
                    <p>Fout bij het initialiseren van de kaart.</p>
                `;
                mapContainer.innerHTML = '';
                mapContainer.appendChild(errorMessage);
            }
        }
    }

    // ============= EVENT LISTENERS =============
    // Year selector change event - update all visualizations when year changes
    yearSelector.addEventListener('change', function() {
        currentYear = this.value;
        updateAllCharts();
    });
    
    // Dark mode toggle button - switch between light/dark themes
    darkModeButton.addEventListener('click', toggleDarkMode);

    // Window resize event to optimize charts for current screen size
    window.addEventListener('resize', function() {
        // Debounce resize events to prevent excessive updates
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(function() {
            // Update the causes per month chart for mobile optimizations
            loadCausesPerMonth();
        }, 250);
    });

    // ============= INITIALIZATION =============
    /**
     * Initialize the application
     * Sets up initial state and loads data
     */
    function init() {
        // Set up dark mode based on saved preference or system setting
        // Set up dark mode
        const savedDarkMode = localStorage.getItem('darkModeManuallySet');
        if (savedDarkMode) {
            const darkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';
            setDarkMode(darkModeEnabled);
        } else {
            setDarkMode(systemPrefersDarkMode());
        }
        setupColorSchemeListener();
        
        // Set initial year and load all charts
        yearSelector.value = currentYear;
        updateAllCharts();
    }
    
    // Start the application
    init();
});
