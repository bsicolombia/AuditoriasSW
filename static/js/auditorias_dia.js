document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById(
        "datos-Auditoria_Dia"
    );

    const canvas = document.getElementById(
        "graficaAuditoriasDia"
    );


    // =====================================================
    // VALIDAR ELEMENTOS
    // =====================================================

    if (!elemento) {

        console.error(
            "❌ NO EXISTE #datos-Auditoria_Dia"
        );

        return;
    }


    if (!canvas) {

        console.error(
            "❌ NO EXISTE #graficaAuditoriasDia"
        );

        return;
    }


    // =====================================================
    // LEER JSON
    // =====================================================

    let datos;

    try {

        datos = JSON.parse(
            elemento.textContent.trim()
        );

    } catch (error) {

        console.error(
            "❌ ERROR CONVIRTIENDO JSON:",
            error
        );

        return;
    }


    // =====================================================
    // VALIDAR DATOS
    // =====================================================

    if (!Array.isArray(datos)) {

        console.error(
            "❌ Los datos no son un array"
        );

        return;
    }


    if (datos.length === 0) {

        console.warn(
            "⚠️ No existen datos para mostrar"
        );

        return;
    }


    // =====================================================
    // DATOS
    // =====================================================

    const labels = datos.map(function (item) {

        return item.fecha || "";

    });


    const total = datos.map(function (item) {

        return Number(item.total) || 0;

    });


    const cumple = datos.map(function (item) {

        return Number(item.cumple) || 0;

    });


    const noCumple = datos.map(function (item) {

        return Number(item.no_cumple) || 0;

    });


    console.log("FECHAS:", labels);
    console.log("TOTAL:", total);
    console.log("CUMPLE:", cumple);
    console.log("NO CUMPLE:", noCumple);


    // =====================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // =====================================================

    const graficaExistente =
        Chart.getChart(canvas);


    if (graficaExistente) {

        graficaExistente.destroy();

    }


    // =====================================================
    // ALTURA DINÁMICA
    // =====================================================

    /*
     * Cada día tendrá 65px.
     *
     * Si hay muchos días aparecerá
     * automáticamente el scroll.
     */

    const alturaPorDia = 65;

    const alturaMinima = 500;


    const altura = Math.max(

        alturaMinima,

        labels.length * alturaPorDia

    );


    canvas.style.height =
        `${altura}px`;

    canvas.style.width =
        "100%";

    canvas.style.maxWidth =
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

                // =================================================
                // 1️⃣ TOTAL
                // =================================================

                {

                    label: "Total",

                    data: total,

                    backgroundColor:
                        "#172554",

                    hoverBackgroundColor:
                        "#1e3a8a",

                    borderRadius: 6,

                    borderSkipped: false,

                    barPercentage: 0.70,

                    categoryPercentage: 0.72,

                    minBarLength: 3,

                    barThickness: 17,

                    maxBarThickness: 17

                },


                // =================================================
                // 2️⃣ CUMPLE
                // =================================================

                {

                    label: "Cumple",

                    data: cumple,

                    backgroundColor:
                        "#22c55e",

                    hoverBackgroundColor:
                        "#16a34a",

                    borderRadius: 6,

                    borderSkipped: false,

                    barPercentage: 0.70,

                    categoryPercentage: 0.72,

                    minBarLength: 3,

                    barThickness: 17,

                    maxBarThickness: 17

                },


                // =================================================
                // 3️⃣ NO CUMPLE
                // =================================================

                {

                    label: "No cumple",

                    data: noCumple,

                    backgroundColor:
                        "#ef4444",

                    hoverBackgroundColor:
                        "#dc2626",

                    borderRadius: 6,

                    borderSkipped: false,

                    barPercentage: 0.70,

                    categoryPercentage: 0.72,

                    minBarLength: 3,

                    barThickness: 17,

                    maxBarThickness: 17

                }

            ]

        },


        // =====================================================
        // OPCIONES
        // =====================================================

        options: {

            responsive: true,

            maintainAspectRatio: false,


            /*
             * Barras horizontales
             */

            indexAxis: "y",


            animation: {

                duration: 500,

                easing: "easeOutQuart"

            },


            interaction: {

                mode: "index",

                intersect: false

            },


            layout: {

                padding: {

                    top: 5,

                    right: 20,

                    bottom: 15,

                    left: 5

                }

            },


            // =================================================
            // EJES
            // =================================================

            scales: {

                // =================================================
                // EJE X
                // =================================================

                x: {

                    beginAtZero: true,

                    grace: "8%",


                    ticks: {

                        precision: 0,

                        color:
                            "#64748b",

                        padding: 8,


                        font: {

                            size: 11,

                            weight: "500"

                        },


                        callback:
                            function (value) {

                                return Number(value)
                                    .toLocaleString(
                                        "es-CO"
                                    );

                            }

                    },


                    grid: {

                        color:
                            "rgba(148, 163, 184, 0.18)",

                        drawTicks: false

                    },


                    border: {

                        display: false

                    }

                },


                // =================================================
                // EJE Y
                // =================================================

                y: {

                    offset: true,


                    ticks: {

                        color:
                            "#334155",

                        padding: 12,


                        font: {

                            size: 12,

                            weight: "600"

                        }

                    },


                    grid: {

                        display: false

                    },


                    border: {

                        display: false

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

                    position: "top",

                    align: "start",


                    labels: {

                        usePointStyle: true,

                        pointStyle: "circle",

                        padding: 20,


                        font: {

                            size: 12,

                            weight: "600"

                        },


                        /*
                         * ORDEN DE LA LEYENDA
                         *
                         * Total
                         * Cumple
                         * No cumple
                         */

                        generateLabels:
                            function (chart) {

                                return [

                                    {

                                        text:
                                            "Total",

                                        fillStyle:
                                            "#172554",

                                        strokeStyle:
                                            "#172554",

                                        pointStyle:
                                            "circle",

                                        datasetIndex:
                                            0

                                    },


                                    {

                                        text:
                                            "Cumple",

                                        fillStyle:
                                            "#22c55e",

                                        strokeStyle:
                                            "#22c55e",

                                        pointStyle:
                                            "circle",

                                        datasetIndex:
                                            1

                                    },


                                    {

                                        text:
                                            "No cumple",

                                        fillStyle:
                                            "#ef4444",

                                        strokeStyle:
                                            "#ef4444",

                                        pointStyle:
                                            "circle",

                                        datasetIndex:
                                            2

                                    }

                                ];

                            }

                    }

                },


                // =================================================
                // TOOLTIP
                // =================================================

                tooltip: {

                    backgroundColor:
                        "rgba(15, 23, 42, 0.97)",

                    titleColor:
                        "#ffffff",

                    bodyColor:
                        "#e2e8f0",

                    borderColor:
                        "rgba(148, 163, 184, 0.30)",

                    borderWidth: 1,

                    cornerRadius: 10,

                    padding: 13,

                    displayColors: true,

                    boxPadding: 5,


                    callbacks: {

                        title:
                            function (items) {

                                if (
                                    !items.length
                                ) {

                                    return "";

                                }


                                return (
                                    "Fecha: " +
                                    items[0].label
                                );

                            },


                        label:
                            function (context) {

                                const valor =
                                    Number(
                                        context.raw
                                    ) || 0;


                                return (
                                    ` ${context.dataset.label}: ` +
                                    valor.toLocaleString(
                                        "es-CO"
                                    )
                                );

                            }

                    }

                },


                // =================================================
                // NÚMEROS SOBRE LAS BARRAS
                // =================================================

                datalabels: {

                    /*
                     * No mostrar números pequeños
                     * para evitar amontonamiento.
                     */

                    display:
                        function (context) {

                            const valor =
                                Number(
                                    context.raw
                                ) || 0;


                            return valor >= 5;

                        },


                    color:
                        "#ffffff",


                    anchor:
                        "center",


                    align:
                        "center",


                    clamp:
                        true,


                    clip:
                        true,


                    font: {

                        weight:
                            "bold",

                        size:
                            10

                    },


                    formatter:
                        function (value) {

                            const numero =
                                Number(value) || 0;


                            if (
                                numero < 5
                            ) {

                                return "";

                            }


                            return numero
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
        `✅ GRÁFICA AUDITORÍAS POR DÍA CREADA: ${datos.length} días`
    );

});