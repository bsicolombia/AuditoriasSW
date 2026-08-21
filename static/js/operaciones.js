document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById("datos-operaciones");

    if (!elemento) {
        return;
    }

    const datos = JSON.parse(elemento.textContent);

    const operaciones = ["DC00", "RC00", "ZVCL"];

    const cumple = operaciones.map(
        operacion => datos[operacion]?.cumple || 0
    );

    const noCumple = operaciones.map(
        operacion => datos[operacion]?.no_cumple || 0
    );

    const total = operaciones.map(
        operacion => datos[operacion]?.total || 0
    );


    new Chart(
        document.getElementById("graficaOperaciones"),
        {
            type: "bar",

            data: {

                labels: operaciones,

                datasets: [

                    {
                        label: "Cumple",
                        data: cumple,
                        backgroundColor: "#22c55e",
                    },

                    {
                        label: "No cumple",
                        data: noCumple,
                        backgroundColor: "#ef4444",
                    },

                    {
                        label: "Total",
                        data: total,
                        backgroundColor: "#172554",
                    }

                ]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        position: "top"
                    },

                    datalabels: {
                        color: "#ffffff",
                        anchor: "center",
                        align: "center",
                        font: {
                            weight: "bold"
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
