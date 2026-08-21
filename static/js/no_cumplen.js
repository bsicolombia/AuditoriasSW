document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById("datos-No-Cumplen");

    if (!elemento) {
        return;
    }

    const datos = JSON.parse(elemento.textContent);

    new Chart(
        document.getElementById("graficaNoCumplen"),
        {
            type: "bar",

            data: {

                labels: [
                    "Cumple",
                    "No cumple",
                    "Total"
                ],

                datasets: [
                    {
                        label: "Auditorías",

                        data: [
                            datos.cumple,
                            datos.no_cumple,
                            datos.total
                        ],

                        backgroundColor: [
                            "#22c55e",
                            "#ef4444",
                            "#172554"
                        ],

                        borderRadius: 8
                    }
                ]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        display: false
                    },

                    datalabels: {
                        color: "#ffffff",
                        font: {
                            weight: "bold",
                            size: 14
                        }
                    }

                },

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }

            },

            plugins: [
                ChartDataLabels
            ]
        }
    );

});
