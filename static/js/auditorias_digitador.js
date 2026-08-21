document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById(
        "datos-Auditorias-Por-Digitador"
    );

    if (!elemento) {
        return;
    }

    const datos = JSON.parse(elemento.textContent);


    const labels = datos.map(
        item => `${item.fecha} - ${item.auditor}`
    );

    const total = datos.map(
        item => item.total
    );

    const cumple = datos.map(
        item => item.cumple
    );

    const noCumple = datos.map(
        item => item.no_cumple
    );


    new Chart(
        document.getElementById(
            "graficaAuditoriasDigitador"
        ),
        {
            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Total",

                        data: total,

                        backgroundColor: "#172554",

                        borderRadius: 5
                    },

                    {
                        label: "Cumple",

                        data: cumple,

                        backgroundColor: "#22c55e",

                        borderRadius: 5
                    },

                    {
                        label: "No cumple",

                        data: noCumple,

                        backgroundColor: "#ef4444",

                        borderRadius: 5
                    }

                ]

            },

            options: {

                responsive: true,

                scales: {

                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }

                },

                plugins: {

                    datalabels: {

                        color: "#ffffff",

                        font: {
                            weight: "bold"
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
