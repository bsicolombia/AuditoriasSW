document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById(
        "datos-Hallazgos-Tecnico"
    );

    if (!elemento) {
        return;
    }

    const datos = JSON.parse(elemento.textContent);

    const labels = datos.map(item => item.tecnico);

    const alto = datos.map(item => item.alto);

    const medio = datos.map(item => item.medio);

    const bajo = datos.map(item => item.bajo);


    new Chart(
        document.getElementById("graficaHallazgosTecnico"),
        {
            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Alto",
                        data: alto,
                        backgroundColor: "rgba(153, 27, 27, 0.70)"
                    },

                    {
                        label: "Medio",
                        data: medio,
                        backgroundColor: "rgba(234, 88, 12, 0.65)"
                    },

                    {
                        label: "Bajo",
                        data: bajo,
                        backgroundColor: "rgba(202, 138, 4, 0.60)"
                    }

                ]

            },

            options: {

                responsive: true,

                scales: {

                    x: {
                        stacked: true
                    },

                    y: {
                        stacked: true,
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
