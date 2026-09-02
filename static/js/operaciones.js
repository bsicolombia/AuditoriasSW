document.addEventListener("DOMContentLoaded", function () {

    console.log("=== OPERACIONES.JS INICIADO ===");

    const elemento =
        document.getElementById("datos-operaciones");

    const canvas =
        document.getElementById("graficaOperaciones");


    // =====================================================
    // VALIDAR ELEMENTOS
    // =====================================================

    if (!elemento) {

        console.error(
            "❌ NO EXISTE #datos-operaciones"
        );

        return;
    }


    if (!canvas) {

        console.error(
            "❌ NO EXISTE #graficaOperaciones"
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
            "❌ ERROR JSON:",
            error
        );

        return;
    }


    // =====================================================
    // VALIDAR ARRAY
    // =====================================================

    if (!Array.isArray(datos)) {

        console.error(
            "❌ datos_operaciones NO ES ARRAY"
        );

        return;
    }


    // =====================================================
    // DATOS
    // =====================================================

    const operaciones =
        datos.map(function (item) {

            return item.operacion;

        });


    const total =
        datos.map(function (item) {

            return Number(item.total) || 0;

        });


    const cumple =
        datos.map(function (item) {

            return Number(item.cumple) || 0;

        });


    const noCumple =
        datos.map(function (item) {

            return Number(item.no_cumple) || 0;

        });


    // =====================================================
    // TOTALES GENERALES
    // =====================================================

    const totalCumple =
        cumple.reduce(
            function (acumulado, valor) {

                return acumulado + valor;

            },
            0
        );


    const totalNoCumple =
        noCumple.reduce(
            function (acumulado, valor) {

                return acumulado + valor;

            },
            0
        );


    const totalAuditorias =
        total.reduce(
            function (acumulado, valor) {

                return acumulado + valor;

            },
            0
        );


    console.log(
        "================================"
    );

    console.log(
        "TOTAL AUDITORÍAS:",
        totalAuditorias
    );

    console.log(
        "TOTAL CUMPLE:",
        totalCumple
    );

    console.log(
        "TOTAL NO CUMPLE:",
        totalNoCumple
    );

    console.log(
        "================================"
    );


    // =====================================================
    // MOSTRAR TOTALES
    // =====================================================

    const elementoCumple =
        document.getElementById(
            "totalCumple"
        );


    const elementoNoCumple =
        document.getElementById(
            "totalNoCumple"
        );


    const elementoTotal =
        document.getElementById(
            "totalAuditorias"
        );


    if (elementoCumple) {

        elementoCumple.textContent =
            totalCumple.toLocaleString(
                "es-CO"
            );

    }


    if (elementoNoCumple) {

        elementoNoCumple.textContent =
            totalNoCumple.toLocaleString(
                "es-CO"
            );

    }


    if (elementoTotal) {

        elementoTotal.textContent =
            totalAuditorias.toLocaleString(
                "es-CO"
            );

    }


    // =====================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // =====================================================

    const graficaExistente =
        Chart.getChart(canvas);


    if (graficaExistente) {

        graficaExistente.destroy();

    }


    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    new Chart(canvas, {

        type: "bar",


        // =================================================
        // DATOS
        // =================================================

        data: {

            labels:
                operaciones,


            datasets: [

                // =============================================
                // 1. TOTAL
                // =============================================

                {

                    label:
                        "Total",

                    data:
                        total,


                    /*
                     * COLOR TOTAL
                     */

                    backgroundColor:
                        "#1e3a8a",

                    hoverBackgroundColor:
                        "#1e3a8a",


                    borderColor:
                        "#1e3a8a",


                    borderRadius:
                        6,


                    borderSkipped:
                        false,


                    minBarLength:
                        8

                },


                // =============================================
                // 2. CUMPLE
                // =============================================

                {

                    label:
                        "Cumple",

                    data:
                        cumple,


                    backgroundColor:
                        "#22c55e",

                    hoverBackgroundColor:
                        "#16a34a",


                    borderColor:
                        "#16a34a",


                    borderRadius:
                        6,


                    borderSkipped:
                        false,


                    minBarLength:
                        8

                },


                // =============================================
                // 3. NO CUMPLE
                // =============================================

                {

                    label:
                        "No cumple",

                    data:
                        noCumple,


                    backgroundColor:
                        "#ef4444",

                    hoverBackgroundColor:
                        "#dc2626",


                    borderColor:
                        "#dc2626",


                    borderRadius:
                        6,


                    borderSkipped:
                        false,


                    minBarLength:
                        8

                }

            ]

        },


        // =====================================================
        // OPCIONES
        // =====================================================

        options: {

            responsive:
                true,


            maintainAspectRatio:
                false,


            // =================================================
            // EJES
            // =================================================

            scales: {

                // =============================================
                // EJE Y
                // =============================================

                y: {

                    beginAtZero:
                        true,


                    ticks: {

                        precision:
                            0,


                        color:
                            "#374151",


                        font: {

                            size:
                                11

                        }

                    },


                    grid: {

                        color:
                            "rgba(148, 163, 184, 0.18)"

                    },


                    border: {

                        display:
                            false

                    }

                },


                // =============================================
                // EJE X
                // =============================================

                x: {

                    ticks: {

                        color:
                            "#374151",


                        font: {

                            weight:
                                "bold",

                            size:
                                12

                        }

                    },


                    grid: {

                        display:
                            false

                    },


                    border: {

                        display:
                            false

                    }

                }

            },


            // =================================================
            // PLUGINS
            // =================================================

            plugins: {

                // =============================================
                // LEYENDA
                // =============================================

                legend: {

                    position:
                        "top",


                    align:
                        "start",


                    labels: {

                        usePointStyle:
                            true,


                        pointStyle:
                            "circle",


                        padding:
                            18,


                        font: {

                            size:
                                12,

                            weight:
                                "bold"

                        },


                        // =====================================
                        // LEYENDA PERSONALIZADA
                        // =====================================

                        generateLabels:
                            function () {

                                return [

                                    // =========================
                                    // TOTAL
                                    // =========================

                                    {

                                        text:
                                            `Total (${totalAuditorias.toLocaleString("es-CO")})`,

                                        fillStyle:
                                            "#1e3a8a",

                                        strokeStyle:
                                            "#1e3a8a",

                                        pointStyle:
                                            "circle",

                                        datasetIndex:
                                            0

                                    },


                                    // =========================
                                    // CUMPLE
                                    // =========================

                                    {

                                        text:
                                            `Cumple (${totalCumple.toLocaleString("es-CO")})`,

                                        fillStyle:
                                            "#22c55e",

                                        strokeStyle:
                                            "#22c55e",

                                        pointStyle:
                                            "circle",

                                        datasetIndex:
                                            1

                                    },


                                    // =========================
                                    // NO CUMPLE
                                    // =========================

                                    {

                                        text:
                                            `No cumple (${totalNoCumple.toLocaleString("es-CO")})`,

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


                // =============================================
                // DATOS SOBRE LAS BARRAS
                // =============================================

                datalabels: {

                    color:
                        "#ffffff",


                    anchor:
                        "center",


                    align:
                        "center",


                    clamp:
                        true,


                    font: {

                        weight:
                            "bold",

                        size:
                            11

                    },


                    formatter:
                        function (value) {

                            if (!value) {

                                return "";

                            }


                            return Number(
                                value
                            ).toLocaleString(
                                "es-CO"
                            );

                        }

                }

            }

        },


        // =====================================================
        // PLUGIN CHARTDATALABELS
        // =====================================================

        plugins: [

            ChartDataLabels

        ]

    });


    console.log(
        "✅ GRÁFICA CREADA CORRECTAMENTE"
    );

});
