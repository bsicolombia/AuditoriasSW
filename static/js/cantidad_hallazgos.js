document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById(
        "datos-Errores-Por-Hallazgo"
    );

    if (!elemento) {
        return;
    }

    const datos = JSON.parse(elemento.textContent);

    const nombres = datos.map(
        item => item.tipo_hallazgo || "Sin tipo"
    );

    const cantidades = datos.map(
        item => item.cantidad
    );

    const colores = nombres.map(nombre => {

        if (nombre === "alto") {
            return "#991b1b";
        }

        if (nombre === "medio") {
            return "#ea580c";
        }

        if (nombre === "bajo") {
            return "#ca8a04";
        }

        return "#64748b";
    });


    new Chart(
        document.getElementById("graficaCantidadHallazgos"),
        {
            type: "bar",

            data: {

                labels: nombres,

                datasets: [

                    {
                        label: "Cantidad",

                        data: cantidades,

                        backgroundColor: colores,

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
