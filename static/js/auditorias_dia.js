document.addEventListener("DOMContentLoaded", function () {

    console.log("=== AUDITORÍAS POR DÍA ===");


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const elemento =
        document.getElementById(
            "datos-Auditoria_Dia"
        );

    const canvas =
        document.getElementById(
            "graficaAuditoriasDia"
        );


    if (!elemento || !canvas) {

        console.error(
            "❌ No se encontró datos o canvas de Auditorías por día"
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
            "❌ Error leyendo JSON:",
            error
        );

        return;
    }


    // =====================================================
    // VALIDAR
    // =====================================================

    if (
        !Array.isArray(datos) ||
        datos.length === 0
    ) {

        console.warn(
            "⚠️ No existen datos para Auditorías por día"
        );

        return;
    }


    // =====================================================
    // ORDENAR POR FECHA
    // =====================================================

    datos.sort(function (a, b) {

        return (
            new Date(b.fecha) -
            new Date(a.fecha)
        );

    });


    // =====================================================
    // PREPARAR DATOS
    // =====================================================

    const labels =
        datos.map(function (item) {

            return item.fecha || "";

        });


    const cumple =
        datos.map(function (item) {

            return Number(
                item.cumple ??
                item.cumplen ??
                0
            ) || 0;

        });


    const noCumple =
        datos.map(function (item) {

            return Number(
                item.no_cumple ??
                item.noCumple ??
                0
            ) || 0;

        });


    /*
     * TOTAL
     *
     * Primero intentamos utilizar el total
     * enviado por Django.
     *
     * Si no existe:
     *
     * TOTAL = CUMPLE + NO CUMPLE
     */

    const total =
        datos.map(function (item, index) {

            const valor =
                Number(item.total) || 0;


            if (valor > 0) {

                return valor;

            }


            return (
                cumple[index] +
                noCumple[index]
            );

        });


    console.log(
        "📅 Fechas:",
        labels
    );

    console.log(
        "🔵 Total:",
        total
    );

    console.log(
        "🟢 Cumplen:",
        cumple
    );

    console.log(
        "🟠 No cumplen:",
        noCumple
    );


    // =====================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // =====================================================

    const anterior =
        Chart.getChart(canvas);


    if (anterior) {

        anterior.destroy();

    }


    // =====================================================
    // ALTURA
    // =====================================================

    /*
     *
     * CADA DÍA TIENE:
     *
     *   TOTAL
     *   CUMPLEN
     *   NO CUMPLEN
     *
     * 90px por día da bastante separación.
     *
     */

    const alturaPorDia = 90;

    const alturaMinima = 500;

    const alturaMaxima = 4000;


    const altura =
        Math.min(
            alturaMaxima,
            Math.max(
                alturaMinima,
                datos.length *
                alturaPorDia
            )
        );


    canvas.style.height =
        `${altura}px`;

    canvas.style.minHeight =
        `${altura}px`;

    canvas.style.width =
        "100%";

    canvas.style.display =
        "block";


    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    new Chart(canvas, {

        type: "bar",


        // =================================================
        // DATOS
        // =================================================

        data: {

            labels: labels,


            datasets: [

                // =========================================
                // TOTAL
                // =========================================

                {

                    label:
                        "Total",

                    data:
                        total,

                    backgroundColor:
                        "#2563eb",

                    hoverBackgroundColor:
                        "#1d4ed8",

                    borderColor:
                        "#2563eb",

                    borderWidth:
                        0,

                    borderRadius:
                        6,

                    borderSkipped:
                        false,

                    barThickness:
                        14,

                    maxBarThickness:
                        14,

                    categoryPercentage:
                        0.72,

                    barPercentage:
                        0.70

                },


                // =========================================
                // CUMPLEN
                // =========================================

                {

                    label:
                        "Cumplen",

                    data:
                        cumple,

                    backgroundColor:
                        "#22c55e",

                    hoverBackgroundColor:
                        "#16a34a",

                    borderColor:
                        "#22c55e",

                    borderWidth:
                        0,

                    borderRadius:
                        6,

                    borderSkipped:
                        false,

                    barThickness:
                        14,

                    maxBarThickness:
                        14,

                    categoryPercentage:
                        0.72,

                    barPercentage:
                        0.70

                },


                // =========================================
                // NO CUMPLEN
                // =========================================

                {

                    label:
                        "No cumplen",

                    data:
                        noCumple,

                    backgroundColor:
                        "#f97316",

                    hoverBackgroundColor:
                        "#ea580c",

                    borderColor:
                        "#f97316",

                    borderWidth:
                        0,

                    borderRadius:
                        6,

                    borderSkipped:
                        false,

                    barThickness:
                        14,

                    maxBarThickness:
                        14,

                    categoryPercentage:
                        0.72,

                    barPercentage:
                        0.70

                }

            ]

        },


        // =================================================
        // OPCIONES
        // =================================================

        options: {

            responsive:
                true,

            maintainAspectRatio:
                false,


            // =================================================
            // HORIZONTAL
            // =================================================

            indexAxis:
                "y",


            // =================================================
            // ANIMACIÓN
            // =================================================

            animation: {

                duration:
                    600,

                easing:
                    "easeOutQuart"

            },


            // =================================================
            // INTERACCIÓN
            // =================================================

            interaction: {

                mode:
                    "index",

                intersect:
                    false

            },


            // =================================================
            // LAYOUT
            // =================================================

            layout: {

                padding: {

                    top:
                        10,

                    right:
                        70,

                    bottom:
                        20,

                    left:
                        10

                }

            },


            // =================================================
            // EJES
            // =================================================

            scales: {


                // =============================================
                // EJE X
                // =============================================

                x: {

                    beginAtZero:
                        true,

                    grace:
                        "10%",


                    border: {

                        display:
                            false

                    },


                    grid: {

                        color:
                            "rgba(148, 163, 184, 0.16)",

                        drawTicks:
                            false

                    },


                    ticks: {

                        precision:
                            0,

                        color:
                            "#64748b",

                        padding:
                            8,


                        font: {

                            size:
                                11,

                            weight:
                                "500"

                        },


                        callback:
                            function (value) {

                                return Number(
                                    value
                                ).toLocaleString(
                                    "es-CO"
                                );

                            }

                    }

                },


                // =============================================
                // EJE Y
                // =============================================

                y: {

                    offset:
                        true,

                    stacked:
                        false,


                    border: {

                        display:
                            false

                    },


                    grid: {

                        display:
                            false

                    },


                    ticks: {

                        color:
                            "#334155",

                        padding:
                            18,

                        autoSkip:
                            false,


                        font: {

                            size:
                                11,

                            weight:
                                "600"

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

                    display:
                        true,

                    position:
                        "top",

                    align:
                        "start",


                    labels: {

                        usePointStyle:
                            true,

                        pointStyle:
                            "circle",

                        boxWidth:
                            10,

                        boxHeight:
                            10,

                        padding:
                            22,

                        color:
                            "#334155",


                        font: {

                            size:
                                12,

                            weight:
                                "600"

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

                    borderWidth:
                        1,

                    cornerRadius:
                        10,

                    padding:
                        13,

                    displayColors:
                        true,

                    boxPadding:
                        5,


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
                // DATALABELS
                // =================================================

                datalabels: {

                    // Mostrar SIEMPRE el número
                    display: true,


                    // Color del número
                    color: "#ffffff",


                    // Número en el centro de la barra
                    anchor: "center",

                    align: "center",


                    // Evita que el número se salga
                    // de la barra
                    clamp: true,

                    clip: true,


                    // Tamaño del número
                    font: {

                        size: 10,

                        weight: "700"

                    },


                    // Formato del número
                    formatter: function (value) {

                        const numero =
                            Number(value) || 0;

                        return numero.toLocaleString(
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


    // =====================================================
    // FINAL
    // =====================================================

    console.log(
        `✅ Auditorías por día creada correctamente: ${datos.length} días`
    );

});
