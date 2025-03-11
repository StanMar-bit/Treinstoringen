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

    // Standaard lege chart
    var myChart = new Chart(ChartCanvas, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Aantal storingen',
                data: [],
                borderWidth: 1,
                backgroundColor: 'rgba(75, 192, 192, 0.6)', 
                borderColor: 'rgba(75, 192, 192, 1)'
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });

    // Functie om treinstoringen per maand te laden
    async function loadMonthlyDisruptions() {
        try {
            const response = await fetch('/Data/disruptions-2024.json');
            const data = await response.json();

            // Storing per maand tellen
            const monthlyCounts = {};
            data.forEach(item => {
                const date = new Date(item.start_time);
                const month = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
                monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
            });

            // Labels en dataset genereren
            const labels = Object.keys(monthlyCounts).sort();
            const values = labels.map(month => monthlyCounts[month]);

            // Grafiek bijwerken
            myChart.data.labels = labels;
            myChart.data.datasets[0].data = values;
            myChart.data.datasets[0].label = 'Aantal storingen per maand';
            myChart.update();

            // Titel updaten
            chartTitle.textContent = "Aantal storingen per maand in 2024";
        } catch (error) {
            console.error("Fout bij laden van data:", error);
        }
    }

    // Functie om oorzaken van treinstoringen te laden
    async function loadDisruptionCauses() {
        try {
            const response = await fetch('/Data/disruptions-2024.json');
            const data = await response.json();

            // Groeperen en tellen per oorzaakstype (`cause_group`)
            const causeCounts = {};
            data.forEach(item => {
                const cause = item.cause_group || "onbekend"; // Fallback voor ontbrekende data
                causeCounts[cause] = (causeCounts[cause] || 0) + 1;
            });

            // Labels en dataset genereren
            const labels = Object.keys(causeCounts);
            const values = labels.map(cause => causeCounts[cause]);

            // Grafiek bijwerken
            myChart.data.labels = labels;
            myChart.data.datasets[0].data = values;
            myChart.data.datasets[0].label = 'Aantal storingen per oorzaak';
            myChart.update();

            // Titel updaten
            chartTitle.textContent = "Oorzaken van treinstoringen in 2024";
        } catch (error) {
            console.error("Fout bij laden van data:", error);
        }
    }

    // Knoppen koppelen aan functies
    ChartButton1.addEventListener('click', loadMonthlyDisruptions);
    ChartButton2.addEventListener('click', loadDisruptionCauses);

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
});
