document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById(
        "datos-Auditorias-Por-Digitador"
    );

    const canvas = document.getElementById(
        "graficaAuditoriasDigitador"
    );


    if (!elemento || !canvas) {

        console.error(
            "❌ No se encontró el elemento de datos o canvas"
        );

        return;
    }


    // =====================================================
    // LEER JSON
    // =====================================================

    let datos;

    try {

        datos = JSON.parse(
            elemento.textContent
        );

    } catch (error) {

        console.error(
            "❌ Error leyendo JSON:",
            error
        );

        return;
    }


    if (!Array.isArray(datos)) {

        console.error(
            "❌ Los datos no son un array"
        );

        return;
    }


    // =====================================================
    // DATOS
    // =====================================================

    const labels = datos.map(
        item =>
            `${item.fecha} - ${item.auditor}`
    );


    const total = datos.map(
        item =>
            Number(item.total) || 0
    );


    const cumple = datos.map(
        item =>
            Number(item.cumple) || 0
    );


    const noCumple = datos.map(
        item =>
            Number(item.no_cumple) || 0
    );


    // =====================================================
    // ELIMINAR GRÁFICA ANTERIOR
    // =====================================================

    const anterior =
        Chart.getChart(canvas);

    if (anterior) {

        anterior.destroy();

    }


    // =====================================================
    // ALTURA DINÁMICA
    // =====================================================

    const alturaPorRegistro = 48;

    const alturaMinima = 500;

    const altura = Math.max(
        alturaMinima,
        labels.length * alturaPorRegistro
    );


    canvas.style.height =
        altura + "px";

    canvas.style.width =
        "100%";

    canvas.style.display =
        "block";


    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    new Chart(canvas, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "Total",

                    data: total,

                    backgroundColor: "#172554",

                    borderRadius: 6,

                    borderSkipped: false,

                    barPercentage: 0.68,

                    categoryPercentage: 0.70
                },


                {
                    label: "Cumple",

                    data: cumple,

                    backgroundColor: "#22c55e",

                    borderRadius: 6,

                    borderSkipped: false,

                    barPercentage: 0.68,

                    categoryPercentage: 0.70
                },


                {
                    label: "No cumple",

                    data: noCumple,

                    backgroundColor: "#ef4444",

                    borderRadius: 6,

                    borderSkipped: false,

                    barPercentage: 0.68,

                    categoryPercentage: 0.70
                }

            ]

        },


        options: {

            responsive: true,

            maintainAspectRatio: false,

            /*
             * BARRAS HORIZONTALES
             */

            indexAxis: "y",


            // =================================================
            // EJES
            // =================================================

            scales: {

                x: {

                    beginAtZero: true,

                    grid: {

                        color: "#e5e7eb",

                        drawBorder: false

                    },

                    border: {

                        display: false

                    },

                    ticks: {

                        precision: 0,

                        color: "#64748b",

                        padding: 6,

                        font: {

                            size: 11

                        }

                    }

                },


                y: {

                    grid: {

                        display: false

                    },

                    border: {

                        display: false

                    },

                    ticks: {

                        color: "#334155",

                        padding: 10,

                        font: {

                            size: 11,

                            weight: "600"

                        },

                        callback:
                            function (value) {

                                const texto =
                                    this.getLabelForValue(
                                        value
                                    );


                                /*
                                 * Cortar nombres largos
                                 */

                                if (
                                    texto.length > 32
                                ) {

                                    return (
                                        texto.substring(
                                            0,
                                            32
                                        ) +
                                        "..."
                                    );

                                }


                                return texto;

                            }

                    }

                }

            },


            // =================================================
            // PLUGINS
            // =================================================

            plugins: {

                // =================================================
                // LEYENDA
                // =================================================

                legend: {

                    display: true,

                    position: "top",

                    align: "start",

                    labels: {

                        usePointStyle: true,

                        pointStyle:
                            "rectRounded",

                        boxWidth: 10,

                        boxHeight: 10,

                        padding: 18,

                        color: "#334155",

                        font: {

                            size: 11,

                            weight: "600"

                        }

                    }

                },


                // =================================================
                // TOOLTIP
                // =================================================

                tooltip: {

                    backgroundColor:
                        "rgba(15, 23, 42, 0.96)",

                    titleColor:
                        "#ffffff",

                    bodyColor:
                        "#e2e8f0",

                    borderColor:
                        "#475569",

                    borderWidth: 1,

                    padding: 12,

                    cornerRadius: 8,

                    displayColors: true,


                    callbacks: {

                        label:
                            function (context) {

                                const valor =
                                    Number(
                                        context.raw
                                    ) || 0;


                                return (
                                    " " +
                                    context.dataset.label +
                                    ": " +
                                    valor.toLocaleString(
                                        "es-CO"
                                    )
                                );

                            }

                    }

                },


                // =================================================
                // VALORES
                // =================================================

                datalabels: {

                    color: "#ffffff",

                    anchor: "center",

                    align: "center",

                    clamp: true,

                    font: {

                        size: 10,

                        weight: "bold"

                    },


                    formatter:
                        function (value) {

                            if (
                                Number(value) === 0
                            ) {

                                return "";

                            }


                            return Number(value)
                                .toLocaleString(
                                    "es-CO"
                                );

                        }

                }

            }

        },


        plugins: [

            ChartDataLabels

        ]

    });


    console.log(
        "✅ GRÁFICA HORIZONTAL CON SCROLL CREADA"
    );

});
