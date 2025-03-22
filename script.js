/**
 * Treinstoringen Dashboard Script
 * 
 * This script handles all functionality for the train disruptions dashboard including:
 * - Chart visualization for monthly disruptions
 * - Pie chart for disruption causes
 * - Line chart for causes per month
 * - Map visualization of railway disruptions
 * - Year selection functionality
 * - Dark mode toggle
 */

// Wait for DOM to load before executing script
document.addEventListener("DOMContentLoaded", function() {
    // ============= DOM ELEMENT SELECTORS =============
    // Main elements
    const body = document.body;
    const ChartCanvas = document.getElementById('myChart');
    const chartTitle = document.getElementById("chartTitle");
    const chartDescription = document.getElementById("chartDescription");
    const containerGraphs = document.querySelector('.container-graphs');
    
    // Selectors (dropdowns)
    const chartSelector = document.getElementById('chartSelector');
    const yearSelector = document.getElementById('yearSelector');
    
    // UI controls
    const darkModeButton = document.getElementById('darkModeButton');
    const collapseButton = document.getElementById('collapseButton');
    const containerLeft = document.querySelector('.container-left');
    
    // ============= APPLICATION STATE =============
    // Current state
    let currentYear = "2024"; // Default year
    let currentChartType = "monthly"; // Default chart type
    let map = null; // Map variable for Leaflet
    
    // Available years (newest to oldest)
    const availableYears = ["2024", "2023", "2022", "2021", "2020", "2019", "2018", 
                           "2017", "2016", "2015", "2014", "2013", "2012", "2011"];
    
    // Chart types and their display names
    const chartTypes = {
        "monthly": "Treinstoringen per maand",
        "causes": "Oorzaak treinstoringen",
        "map": "Storingen op het spoor",
        "causesPerMonth": "Oorzaken per maand"
    };
    
    // Get theme colors from CSS
    const style = getComputedStyle(document.documentElement);
    const blauwColor = style.getPropertyValue('--blauw');

    // ============= CHART INITIALIZATION =============
    // Initialize empty chart with default configuration
    const myChart = new Chart(ChartCanvas, {
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
        options: {
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
        }
    });

    // ============= UTILITY FUNCTIONS =============
    
    /**
     * Updates body classes based on chart type
     * @param {string} chartType - The type of chart being displayed
     */
    function updateChartTypeClass(chartType) {
        document.body.classList.remove('line-chart-active');
        
        if (chartType === "causesPerMonth") {
            document.body.classList.add('line-chart-active');
        }
    }
    
    /**
     * Loads the selected chart based on current selections
     */
    function loadSelectedChart() {
        switch(currentChartType) {
            case "monthly":
                loadMonthlyDisruptions();
                break;
            case "causes":
                loadDisruptionCauses();
                break;
            case "map":
                loadRailwayMap();
                break;
            case "causesPerMonth":
                loadCausesPerMonth();
                break;
        }
    }
    
    /**
     * Shows chart and hides map
     */
    function showChart() {
        ChartCanvas.style.display = 'block';
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer) {
            mapContainer.style.display = 'none';
        }
    }
    
    /**
     * Shared error handling for chart data loading
     * @param {Error} error - The error that occurred
     * @param {string} year - The year that was being loaded
     */
    function handleChartError(error, year) {
        console.error("Error loading data:", error);
        chartDescription.textContent = `Er is een fout opgetreden bij het laden van data voor ${year}. Mogelijk zijn er geen gegevens beschikbaar voor dit jaar.`;
        
        // Reset chart to empty state
        myChart.data.labels = [];
        myChart.data.datasets = [{
            label: 'Geen data beschikbaar',
            data: [],
            backgroundColor: blauwColor,
            borderColor: blauwColor
        }];
        myChart.update();
    }

    // ============= DATA LOADING FUNCTIONS =============
    
    /**
     * Loads monthly disruption data and updates bar chart
     */
    async function loadMonthlyDisruptions() {
        try {
            currentChartType = "monthly";
            showChart();
            updateChartTypeClass("monthly");
            
            const response = await fetch(`./Data/disruptions-${currentYear}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Dutch month names
            const monthNames = {
                '01': 'Januari', '02': 'Februari', '03': 'Maart', '04': 'April',
                '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Augustus',
                '09': 'September', '10': 'Oktober', '11': 'November', '12': 'December'
            };

            // Count disruptions per month
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

            // Set chart type and update data
            myChart.config.type = 'bar';
            myChart.data.labels = labels;
            myChart.data.datasets = [{
                label: 'Aantal storingen per maand',
                data: values,
                borderWidth: 1,
                backgroundColor: blauwColor,
                borderColor: blauwColor
            }];

            // Configure chart options
            myChart.options.scales.y.display = true;
            myChart.options.scales.x.display = true;
            
            myChart.update();

            // Update title and description
            chartTitle.textContent = `Aantal storingen per maand in ${currentYear}`;
            chartDescription.textContent = `Deze grafiek toont het aantal treinstoringen per maand in ${currentYear}. De blauwe balken geven het totale aantal storingen weer voor elke maand.`;

        } catch (error) {
            handleChartError(error, currentYear);
        }
    }

    /**
     * Loads disruption causes data and updates pie chart
     */
    async function loadDisruptionCauses() {
        try {
            currentChartType = "causes";
            showChart();
            updateChartTypeClass("causes");
            
            const response = await fetch(`./Data/disruptions-${currentYear}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Translations for cause groups
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

            // Set chart type to pie
            myChart.config.type = 'pie';
            
            // Update chart data
            myChart.data.labels = labels;
            myChart.data.datasets = [{
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
            myChart.options.scales.y.display = false;
            myChart.options.scales.x.display = false;

            myChart.update();

            // Update title and description
            chartTitle.textContent = `Oorzaken van treinstoringen in ${currentYear}`;
            chartDescription.textContent = `Deze cirkeldiagram laat zien hoe de verschillende oorzaken van treinstoringen zijn verdeeld in ${currentYear}. Elke kleur vertegenwoordigt een andere categorie van storingen.`;

        } catch (error) {
            handleChartError(error, currentYear);
        }
    }

    /**
     * Loads causes per month data and updates line chart
     */
    async function loadCausesPerMonth() {
        try {
            currentChartType = "causesPerMonth";
            showChart();
            updateChartTypeClass("causesPerMonth");
            
            const response = await fetch(`./Data/disruptions-${currentYear}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Translations for cause groups
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

            // Dutch month names
            const monthNames = {
                '01': 'Januari', '02': 'Februari', '03': 'Maart', '04': 'April',
                '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Augustus',
                '09': 'September', '10': 'Oktober', '11': 'November', '12': 'December'
            };

            // Prepare all months of the year in order
            const allMonths = Object.values(monthNames);
            
            // Group by cause and month
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

            // Create datasets for the chart
            const datasets = [];
            const colors = [
                '#003082', '#FFC917', '#E6E6E9', '#4D79B3', 
                '#FFE066', '#999999', '#001F52', '#CC9900', 
                '#5D8AA8', '#A52A2A'
            ];

            // Create dataset for each cause
            let colorIndex = 0;
            for (const cause in causesPerMonth) {
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

            // Set chart type to line
            myChart.config.type = 'line';
            
            // Update chart data
            myChart.data.labels = allMonths;
            myChart.data.datasets = datasets;
            
            // Configure chart options
            myChart.options.scales.y.display = true;
            myChart.options.scales.x.display = true;
            myChart.options.plugins.legend.display = true;
            
            myChart.update();

            // Update title and description
            chartTitle.textContent = `Oorzaken van storingen per maand in ${currentYear}`;
            chartDescription.textContent = `Deze grafiek toont hoe de verschillende oorzaken van treinstoringen per maand zijn verdeeld in ${currentYear}. Elke lijn vertegenwoordigt een andere categorie van storingen.`;

        } catch (error) {
            handleChartError(error, currentYear);
        }
    }

    /**
     * Loads railway map showing disruptions
     */
    async function loadRailwayMap() {
        try {
            currentChartType = "map";
            updateChartTypeClass("map");
            
            // Hide chart canvas
            ChartCanvas.style.display = 'none';
            
            // Create or show map container
            let mapContainer = document.getElementById('mapContainer');
            if (!mapContainer) {
                mapContainer = document.createElement('div');
                mapContainer.id = 'mapContainer';
                containerGraphs.appendChild(mapContainer);
            }
            mapContainer.style.display = 'block';

            // Fetch railway data
            const response = await fetch('/Data/train-map.json');
            const trackData = await response.json();

            // Initialize map if not already initialized
            if (!map) {
                map = L.map('mapContainer').setView([52.1326, 5.2913], 7);
                
                // Add tile layer (use dark style if in dark mode)
                const isDarkMode = body.classList.contains('dark-mode');
                const tileLayer = isDarkMode ? 
                    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' :
                    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                
                L.tileLayer(tileLayer, {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                // Find maximum disruptions for color scaling
                const maxDisruptions = Math.max(...trackData.map(track => track.disruptions));

                // Add tracks to map
                trackData.forEach(track => {
                    // Skip single station entries (those with only one coordinate)
                    if (track.coords.length <= 1) return;
                    
                    // Calculate color based on disruption count
                    const percentage = track.disruptions / maxDisruptions;
                    const color = percentage > 0.75 ? '#b10026' :
                                percentage > 0.5 ? '#fc4e2a' :
                                percentage > 0.25 ? '#feb24c' : 
                                percentage > 0 ? '#ffeda0' : '#cccccc';

                    // Create popup content
                    const popupContent = `
                        <b>${track.name}</b><br>
                        Aantal storingen: ${track.disruptions}
                    `;

                    // Add track to map
                    L.polyline(track.coords, {
                        color: color,
                        weight: 3,
                        opacity: 0.8
                    })
                    .bindPopup(popupContent)
                    .addTo(map);
                });

                // Add station markers for single coordinates
                trackData.forEach(track => {
                    if (track.coords.length === 1) {
                        L.circle(track.coords[0], {
                            color: '#003082',
                            fillColor: '#003082',
                            fillOpacity: 0.8,
                            radius: 300
                        })
                        .bindPopup(`<b>${track.name}</b><br>Aantal storingen: ${track.disruptions}`)
                        .addTo(map);
                    }
                });
            }

            // Update title and description
            chartTitle.textContent = `Storingen op het spoor in ${currentYear}`;
            chartDescription.textContent = `Deze kaart toont de Nederlandse spoorwegen, waarbij de kleurintensiteit het aantal storingen per traject aangeeft in ${currentYear}. Rood betekent veel storingen (>75%), oranje gemiddeld (50-75%), geel weinig (25-50%), en lichtgeel zeer weinig (<25%) storingen. Stations zijn aangegeven met blauwe punten.`;

            // Ensure map renders correctly
            setTimeout(() => {
                map.invalidateSize();
            }, 100);

        } catch (error) {
            console.error("Fout bij laden van kaart:", error);
            chartDescription.textContent = "Er is een fout opgetreden bij het laden van de kaart.";
        }
    }

    // ============= UI FUNCTIONALITY =============
    
    /**
     * Toggles dark mode
     */
    function toggleDarkMode() {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        
        // Update button text
        darkModeButton.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        
        // Update chart colors
        const textColor = isDarkMode ? '#ffffff' : '#39394D';
        const gridColor = isDarkMode ? '#404040' : '#E6E6E9';
        const backgroundColor = isDarkMode ? '#2d2d2d' : '#ffffff';
        
        // Update chart styling
        ChartCanvas.style.backgroundColor = backgroundColor;
        myChart.options.plugins.legend.labels.color = textColor;
        myChart.options.scales.x.ticks.color = textColor;
        myChart.options.scales.y.ticks.color = textColor;
        myChart.options.scales.x.grid.color = gridColor;
        myChart.options.scales.y.grid.color = gridColor;
        myChart.update();

        // Update map style if it exists
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

    // ============= EVENT LISTENERS =============
    
    // Chart selector change event
    chartSelector.addEventListener('change', function() {
        currentChartType = this.value;
        loadSelectedChart();
    });
    
    // Year selector change event
    yearSelector.addEventListener('change', function() {
        currentYear = this.value;
        loadSelectedChart();
    });
    
    // Sidebar collapse toggle
    collapseButton.addEventListener('click', function() {
        containerLeft.classList.toggle('collapsed');
        // Update chart size after collapse animation completes
        setTimeout(() => {
            myChart.resize();
        }, 300);
    });
    
    // Dark mode toggle
    darkModeButton.addEventListener('click', toggleDarkMode);

    // ============= INITIALIZATION =============
    // Set initial dropdown values
    chartSelector.value = currentChartType;
    yearSelector.value = currentYear;
    
    // Load initial chart
    loadSelectedChart();
});
