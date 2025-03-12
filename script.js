// Wacht tot DOM geladen is
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM is geladen en custom script draait");

    // Elementen ophalen
    var body = document.body;
    var ChartCanvas = document.getElementById('myChart');
    var ChartButton1 = document.getElementById('ChartButton1'); // Treinstoringen per maand
    var ChartButton2 = document.getElementById('ChartButton2'); // Oorzaak treinstoringen
    var darkModeButton = document.getElementById('darkModeButton');
    var chartTitle = document.getElementById("chartTitle");
    var chartDescription = document.getElementById("chartDescription");
    var collapseButton = document.getElementById('collapseButton');
    var containerLeft = document.querySelector('.container-left');

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
                        maxTicksLimit: 10
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false,   //laat alle maanden zien
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
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
        [ChartButton1, ChartButton2].forEach(button => {
            button.classList.remove('active');
        });
        // Add active class to clicked button
        activeButton.classList.add('active');
    }

    // Functie om treinstoringen per maand te laden
    async function loadMonthlyDisruptions() {
        try {
            const response = await fetch('/Data/disruptions-2024.json');
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
            myChart.data.datasets[0].data = values;
            myChart.data.datasets[0].label = 'Aantal storingen per maand';
            myChart.data.datasets[0].backgroundColor = blauwColor;
            myChart.data.datasets[0].borderColor = blauwColor;

            // Update chart options for bar chart
            myChart.options.scales.y.display = true;
            myChart.options.scales.x.display = true;
            
            myChart.update();

            // Titel en beschrijving updaten
            chartTitle.textContent = "Aantal storingen per maand in 2024";
            chartDescription.textContent = "Deze grafiek toont het aantal treinstoringen per maand in 2024. De blauwe balken geven het totale aantal storingen weer voor elke maand.";

        } catch (error) {
            console.error("Fout bij laden van data:", error);
        }
    }

    // Functie om oorzaken van treinstoringen te laden
    async function loadDisruptionCauses() {
        try {
            const response = await fetch('/Data/disruptions-2024.json');
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
                const cause = item.cause_group || "unknown"; // Fallback voor ontbrekende data
                const translatedCause = causeTranslations[cause] || cause; // Gebruik vertaling of origineel als geen vertaling bestaat
                causeCounts[translatedCause] = (causeCounts[translatedCause] || 0) + 1;
            });

            // Labels en dataset genereren
            const labels = Object.keys(causeCounts);
            const values = labels.map(cause => causeCounts[cause]);

            // Set chart type to pie
            myChart.config.type = 'pie';
            
            // Grafiek bijwerken
            myChart.data.labels = labels;
            myChart.data.datasets[0].data = values;
            myChart.data.datasets[0].label = 'Aantal storingen per oorzaak';
            
            // Colors for pie chart
            myChart.data.datasets[0].backgroundColor = [
                '#003082',  // Main blue
                '#FFC917',  // Main yellow
                '#E6E6E9',  // Main grey
                '#4D79B3',  // Lighter blue
                '#FFE066',  // Lighter yellow
                '#999999',  // Darker grey
                '#001F52',  // Darker blue
                '#CC9900',  // Darker yellow
            ];

            // Hide scales for pie chart
            myChart.options.scales.y.display = false;
            myChart.options.scales.x.display = false;

            myChart.update();

            // Titel en beschrijving updaten
            chartTitle.textContent = "Oorzaken van treinstoringen in 2024";
            chartDescription.textContent = "Deze cirkeldiagram laat zien hoe de verschillende oorzaken van treinstoringen zijn verdeeld. Elke kleur vertegenwoordigt een andere categorie van storingen.";

        } catch (error) {
            console.error("Fout bij laden van data:", error);
        }
    }

    // Knoppen koppelen aan functies met active state
    ChartButton1.addEventListener('click', function() {
        updateActiveButton(ChartButton1);
        loadMonthlyDisruptions();
    });
    
    ChartButton2.addEventListener('click', function() {
        updateActiveButton(ChartButton2);
        loadDisruptionCauses();
    });

    // Functie om donkere modus te wisselen
    function toggleDarkMode() {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            darkModeButton.textContent = '☀️ Light Mode';
            ChartCanvas.style.backgroundColor = '#333';
        } else {
            darkModeButton.textContent = '🌙 Dark Mode';
            ChartCanvas.style.backgroundColor = '#fff';
        }
        myChart.update();
    }

    // Knop koppelen aan donkere modus
    darkModeButton.addEventListener('click', toggleDarkMode);

    // Load initial graph and set active state
    loadMonthlyDisruptions();
    updateActiveButton(ChartButton1);
});
