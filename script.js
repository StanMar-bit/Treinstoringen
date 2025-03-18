// Wacht tot DOM geladen is
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM is geladen en custom script draait");

    // Elementen ophalen
    var body = document.body;
    var ChartCanvas = document.getElementById('myChart');
    var ChartButton1 = document.getElementById('ChartButton1'); // Treinstoringen per maand
    var ChartButton2 = document.getElementById('ChartButton2'); // Oorzaak treinstoringen
    var ChartButton3 = document.getElementById('ChartButton3'); // Storingen op het spoor
    var ChartButton4 = document.getElementById('ChartButton4'); // Oorzaken per maand
    var darkModeButton = document.getElementById('darkModeButton');
    var chartTitle = document.getElementById("chartTitle");
    var chartDescription = document.getElementById("chartDescription");
    var collapseButton = document.getElementById('collapseButton');
    var containerLeft = document.querySelector('.container-left');
    var containerGraphs = document.querySelector('.container-graphs');

    // Map variable
    var map = null;

    // Voeg toe aan het begin waar alle variabelen worden gedeclareerd
    var currentYear = "2024"; // Standaard jaar
    var currentChartType = "monthly"; // Huidige grafiektype: "monthly", "causes", "map", of "causesPerMonth"

    // Elements voor de jaarselector
    var yearPrevButton = document.querySelector('.year-prev');
    var yearNextButton = document.querySelector('.year-next');
    var yearDisplay = document.querySelector('.current-year-display');

    // Array met beschikbare jaren (van meest recent naar ouder)
    const availableYears = ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011"];

    // Collapse functionality
    collapseButton.addEventListener('click', function() {
        containerLeft.classList.toggle('collapsed');
        // Update chart size after collapse
        setTimeout(() => {
            myChart.resize();
        }, 300); // Wait for transition to complete
    });

    // Get CSS variables
    const style = getComputedStyle(document.documentElement);
    const blauwColor = style.getPropertyValue('--blauw');

    // Standaard lege chart
    var myChart = new Chart(ChartCanvas, {
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

    // Functie om actieve button state te updaten
    function updateActiveButton(activeButton) {
        // Remove active class from all buttons
        [ChartButton1, ChartButton2, ChartButton3, ChartButton4].forEach(button => {
            button.classList.remove('active');
        });
        // Add active class to clicked button
        activeButton.classList.add('active');
    }

    // Functie om jaar weer te geven
    function updateYearDisplay() {
        yearDisplay.textContent = currentYear;
    }

    // Event listeners voor de pijltjes-knoppen
    yearPrevButton.addEventListener('click', function() {
        const currentIndex = availableYears.indexOf(currentYear);
        if (currentIndex < availableYears.length - 1) {
            currentYear = availableYears[currentIndex + 1];
            updateYearDisplay();
            reloadCurrentChart();
        }
    });

    yearNextButton.addEventListener('click', function() {
        const currentIndex = availableYears.indexOf(currentYear);
        if (currentIndex > 0) {
            currentYear = availableYears[currentIndex - 1];
            updateYearDisplay();
            reloadCurrentChart();
        }
    });

    // Functie om huidige grafiek te herladen met nieuw jaar
    function reloadCurrentChart() {
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

    // Voeg deze functie toe om klassen toe te voegen/verwijderen voor specifieke grafiektypen
    function updateChartTypeClass(chartType) {
        document.body.classList.remove('line-chart-active');
        
        if (chartType === "causesPerMonth") {
            document.body.classList.add('line-chart-active');
        }
    }

    // Wijzig de loadMonthlyDisruptions functie om het jaar te gebruiken
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

            // Maanden in Nederlands
            const monthNames = {
                '01': 'Januari',
                '02': 'Februari',
                '03': 'Maart',
                '04': 'April',
                '05': 'Mei',
                '06': 'Juni',
                '07': 'Juli',
                '08': 'Augustus',
                '09': 'September',
                '10': 'Oktober',
                '11': 'November',
                '12': 'December'
            };

            // Storing per maand tellen
            const monthlyCounts = {};
            data.forEach(item => {
                const date = new Date(item.start_time);
                const monthNum = String(date.getMonth() + 1).padStart(2, '0');
                const monthName = monthNames[monthNum];
                monthlyCounts[monthName] = (monthlyCounts[monthName] || 0) + 1;
            });

            // Labels en dataset genereren
            const labels = Object.keys(monthlyCounts);
            const values = labels.map(month => monthlyCounts[month]);

            // Set chart type to bar
            myChart.config.type = 'bar';

            // Grafiek bijwerken
            myChart.data.labels = labels;
            myChart.data.datasets = [{
                label: 'Aantal storingen per maand',
                data: values,
                borderWidth: 1,
                backgroundColor: blauwColor,
                borderColor: blauwColor
            }];

            // Update chart options for bar chart
            myChart.options.scales.y.display = true;
            myChart.options.scales.x.display = true;
            
            myChart.update();

            // Titel en beschrijving updaten
            chartTitle.textContent = `Aantal storingen per maand in ${currentYear}`;
            chartDescription.textContent = `Deze grafiek toont het aantal treinstoringen per maand in ${currentYear}. De blauwe balken geven het totale aantal storingen weer voor elke maand.`;

        } catch (error) {
            console.error("Fout bij laden van data:", error);
            chartDescription.textContent = `Er is een fout opgetreden bij het laden van data voor ${currentYear}. Mogelijk zijn er geen gegevens beschikbaar voor dit jaar.`;
            myChart.data.labels = [];
            myChart.data.datasets = [{
                label: 'Geen data beschikbaar',
                data: [],
                backgroundColor: blauwColor,
                borderColor: blauwColor
            }];
            myChart.update();
        }
    }

    // Wijzig de loadDisruptionCauses functie om het jaar te gebruiken
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

            // Vertalingen voor oorzaakgroepen
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

            // Groeperen en tellen per oorzaakstype (`cause_group`)
            const causeCounts = {};
            data.forEach(item => {
                const cause = item.cause_group || "unknown";
                const translatedCause = causeTranslations[cause] || cause;
                causeCounts[translatedCause] = (causeCounts[translatedCause] || 0) + 1;
            });

            // Labels en dataset genereren
            const labels = Object.keys(causeCounts);
            const values = labels.map(cause => causeCounts[cause]);

            // Set chart type to pie
            myChart.config.type = 'pie';
            
            // Grafiek bijwerken
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
            
            // Hide scales for pie chart
            myChart.options.scales.y.display = false;
            myChart.options.scales.x.display = false;

            myChart.update();

            // Titel en beschrijving updaten
            chartTitle.textContent = `Oorzaken van treinstoringen in ${currentYear}`;
            chartDescription.textContent = `Deze cirkeldiagram laat zien hoe de verschillende oorzaken van treinstoringen zijn verdeeld in ${currentYear}. Elke kleur vertegenwoordigt een andere categorie van storingen.`;

        } catch (error) {
            console.error("Fout bij laden van data:", error);
            chartDescription.textContent = `Er is een fout opgetreden bij het laden van data voor ${currentYear}. Mogelijk zijn er geen gegevens beschikbaar voor dit jaar.`;
            myChart.data.labels = ['Geen data beschikbaar'];
            myChart.data.datasets = [{
                label: 'Geen data beschikbaar',
                data: [1],
                backgroundColor: ['#E6E6E9']
            }];
            myChart.update();
        }
    }

    // Wijzig ook loadCausesPerMonth om jaren te ondersteunen
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

            // Vertalingen voor oorzaakgroepen
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

            // Maanden in Nederlands
            const monthNames = {
                '01': 'Januari',
                '02': 'Februari',
                '03': 'Maart',
                '04': 'April',
                '05': 'Mei',
                '06': 'Juni',
                '07': 'Juli',
                '08': 'Augustus',
                '09': 'September',
                '10': 'Oktober',
                '11': 'November',
                '12': 'December'
            };

            // Alle maanden van het jaar voorbereiden (sortering)
            const allMonths = Object.values(monthNames);
            
            // Groeperen per oorzaak en maand
            const causesPerMonth = {};
            
            data.forEach(item => {
                const date = new Date(item.start_time);
                const monthNum = String(date.getMonth() + 1).padStart(2, '0');
                const monthName = monthNames[monthNum];
                
                const cause = item.cause_group || "unknown";
                const translatedCause = causeTranslations[cause] || cause;
                
                // Initialiseer de oorzaak als het nog niet bestaat
                if (!causesPerMonth[translatedCause]) {
                    causesPerMonth[translatedCause] = {};
                    allMonths.forEach(month => {
                        causesPerMonth[translatedCause][month] = 0;
                    });
                }
                
                // Tel de storing voor deze oorzaak en maand
                causesPerMonth[translatedCause][monthName] = (causesPerMonth[translatedCause][monthName] || 0) + 1;
            });

            // Datasets voor de chart maken
            const datasets = [];
            const colors = [
                '#003082',  // Main blue
                '#FFC917',  // Main yellow
                '#E6E6E9',  // Main grey
                '#4D79B3',  // Lighter blue
                '#FFE066',  // Lighter yellow
                '#999999',  // Darker grey
                '#001F52',  // Darker blue
                '#CC9900',  // Darker yellow
                '#5D8AA8',  // Blue
                '#A52A2A',  // Brown
            ];

            // Maak een dataset per oorzaak
            let colorIndex = 0;
            for (const cause in causesPerMonth) {
                const values = allMonths.map(month => causesPerMonth[cause][month]);
                
                datasets.push({
                    label: cause,
                    data: values,
                    borderColor: colors[colorIndex % colors.length],
                    backgroundColor: colors[colorIndex % colors.length] + '33', // transparante versie
                    borderWidth: 2,
                    tension: 0.2,  // licht gebogen lijnen
                    fill: false
                });
                
                colorIndex++;
            }

            // Set chart type to line
            myChart.config.type = 'line';
            
            // Grafiek bijwerken
            myChart.data.labels = allMonths;
            myChart.data.datasets = datasets;
            
            // Update chart options for line chart
            myChart.options.scales.y.display = true;
            myChart.options.scales.x.display = true;
            myChart.options.plugins.legend.display = true;
            
            myChart.update();

            // Titel en beschrijving updaten
            chartTitle.textContent = `Oorzaken van storingen per maand in ${currentYear}`;
            chartDescription.textContent = `Deze grafiek toont hoe de verschillende oorzaken van treinstoringen per maand zijn verdeeld in ${currentYear}. Elke lijn vertegenwoordigt een andere categorie van storingen.`;

        } catch (error) {
            console.error("Fout bij laden van data:", error);
            chartDescription.textContent = `Er is een fout opgetreden bij het laden van data voor ${currentYear}. Mogelijk zijn er geen gegevens beschikbaar voor dit jaar.`;
            myChart.data.labels = [];
            myChart.data.datasets = [];
            myChart.update();
        }
    }

    // Eventueel aanpassen van de kaartfunctie om het jaar te gebruiken
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
                
                // Add tile layer (use a dark style if in dark mode)
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

            // Trigger a resize event to ensure map renders correctly
            setTimeout(() => {
                map.invalidateSize();
            }, 100);

        } catch (error) {
            console.error("Fout bij laden van kaart:", error);
            chartDescription.textContent = "Er is een fout opgetreden bij het laden van de kaart.";
        }
    }

    // Function to show chart and hide map
    function showChart() {
        ChartCanvas.style.display = 'block';
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer) {
            mapContainer.style.display = 'none';
        }
    }

    // Event listeners for buttons
    ChartButton1.addEventListener('click', function() {
        updateActiveButton(ChartButton1);
        showChart();
        loadMonthlyDisruptions();
    });
    
    ChartButton2.addEventListener('click', function() {
        updateActiveButton(ChartButton2);
        showChart();
        loadDisruptionCauses();
    });

    ChartButton3.addEventListener('click', function() {
        updateActiveButton(ChartButton3);
        loadRailwayMap();
    });

    ChartButton4.addEventListener('click', function() {
        updateActiveButton(ChartButton4);
        loadCausesPerMonth();
    });

    // Functie om donkere modus te wisselen
    function toggleDarkMode() {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        
        // Update button text
        darkModeButton.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        
        // Update chart colors
        const textColor = isDarkMode ? '#ffffff' : '#39394D';
        const gridColor = isDarkMode ? '#404040' : '#E6E6E9';
        const backgroundColor = isDarkMode ? '#2d2d2d' : '#ffffff';
        
        // Update chart background and colors
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

    // Knop koppelen aan donkere modus
    darkModeButton.addEventListener('click', toggleDarkMode);

    // Load initial graph and set active state
    loadMonthlyDisruptions();
    updateActiveButton(ChartButton1);

    // Bij het laden van de pagina, activeer de knop voor het standaard jaar
    updateYearDisplay();
});
