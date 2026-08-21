document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById(
        "datos-Auditoria_Dia"
    );

    if (!elemento) {
        return;
    }

    const datos = JSON.parse(elemento.textContent);

    const labels = datos.map(item => item.fecha);

    const cumple = datos.map(item => item.cumple);

    const noCumple = datos.map(item => item.no_cumple);

    const total = datos.map(item => item.total);


    new Chart(
        document.getElementById("graficaAuditoriasDia"),
        {
            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Cumple",
                        data: cumple,
                        backgroundColor: "#22c55e"
                    },

                    {
                        label: "No cumple",
                        data: noCumple,
                        backgroundColor: "#ef4444"
                    },

                    {
                        label: "Total",
                        data: total,
                        backgroundColor: "#172554"
                    }

                ]

            },

            options: {

                responsive: true,

                scales: {

                    x: {
                        stacked: false
                    },

                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }

                },

                plugins: {

                    datalabels: {
                        display: false
                    }

                }

            }
        }
    );

});
