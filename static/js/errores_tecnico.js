document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById(
        "datos-Errores-Por-Tecnicos"
    );

    if (!elemento) {
        return;
    }

    const datos = JSON.parse(elemento.textContent);

    const tecnicos = [
        ...new Set(
            datos.map(item => item.tecnico)
        )
    ];

    const tipos = [
        "alto",
        "medio",
        "bajo",
        "sin_tipo"
    ];

    const colores = {
        alto: "#991b1b",
        medio: "#ea580c",
        bajo: "#ca8a04",
        sin_tipo: "#64748b"
    };

    const datasets = tipos.map(tipo => {

        return {

            label: tipo === "sin_tipo"
                ? "Sin tipo"
                : tipo.charAt(0).toUpperCase() + tipo.slice(1),

            data: tecnicos.map(tecnico => {

                const encontrado = datos.find(
                    item =>
                        item.tecnico === tecnico &&
                        item.tipo_hallazgo === tipo
                );

                return encontrado
                    ? encontrado.cantidad
                    : 0;
            }),

            backgroundColor: colores[tipo]

        };

    });


    new Chart(
        document.getElementById("graficaErroresTecnico"),
        {
            type: "bar",

            data: {

                labels: tecnicos,

                datasets: datasets

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
