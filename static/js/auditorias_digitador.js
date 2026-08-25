document.addEventListener("DOMContentLoaded", function () {

    console.log("=== AUDITORÍAS POR DIGITADOR ===");


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const elemento =
        document.getElementById(
            "datos-Auditorias-Por-Digitador"
        );

    const canvas =
        document.getElementById(
            "graficaAuditoriasDigitador"
        );


    if (!elemento || !canvas) {

        console.error(
            "❌ No existe datos o canvas de digitadores"
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
            "⚠️ No existen datos de digitadores"
        );

        return;
    }


    // =====================================================
    // ORDENAR POR FECHA
    // =====================================================

    datos.sort(function (a, b) {

        const fechaA =
            new Date(a.fecha);

        const fechaB =
            new Date(b.fecha);


        if (
            fechaA - fechaB !== 0
        ) {

            return fechaA - fechaB;

        }


        return String(
            a.auditor || ""
        ).localeCompare(
            String(b.auditor || ""),
            "es"
        );

    });


    // =====================================================
    // PREPARAR DATOS
    // =====================================================

    const labels =
        datos.map(function (item) {

            return {

                fecha:
                    item.fecha || "",

                auditor:
                    item.auditor ||
                    "Sin digitador"

            };

        });


    const cumple =
        datos.map(function (item) {

            return Number(
                item.cumple
            ) || 0;

        });


    const noCumple =
        datos.map(function (item) {

            return Number(
                item.no_cumple
            ) || 0;

        });


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
     * Antes:
     *
     * 125px por registro
     *
     * Era demasiado grande.
     *
     * Ahora:
     *
     * 62px por registro.
     *
     * Los registros quedan mucho más juntos.
     */

    const alturaPorRegistro = 62;

    const alturaMinima = 450;

    const alturaMaxima = 5000;


    const altura =
        Math.min(
            alturaMaxima,
            Math.max(
                alturaMinima,
                datos.length *
                alturaPorRegistro
            )
        );


    canvas.style.height =
        `${altura}px`;

    canvas.style.width =
        "100%";

    canvas.style.display =
        "block";


    // =====================================================
    // GRÁFICA
    // =====================================================

    new Chart(canvas, {

        type: "bar",


        data: {

            labels: labels,


            datasets: [

                // =================================================
                // TOTAL
                // =================================================

                {

                    label:
                        "Total",

                    data:
                        total,

                    backgroundColor:
                        "#172554",

                    hoverBackgroundColor:
                        "#1e3a8a",

                    borderRadius:
                        5,

                    borderSkipped:
                        false,

                    barThickness:
                        15,

                    maxBarThickness:
                        15

                },


                // =================================================
                // CUMPLE
                // =================================================

                {

                    label:
                        "Cumple",

                    data:
                        cumple,

                    backgroundColor:
                        "#22c55e",

                    hoverBackgroundColor:
                        "#16a34a",

                    borderRadius:
                        5,

                    borderSkipped:
                        false,

                    barThickness:
                        15,

                    maxBarThickness:
                        15

                },


                // =================================================
                // NO CUMPLE
                // =================================================

                {

                    label:
                        "No cumple",

                    data:
                        noCumple,

                    backgroundColor:
                        "#ef4444",

                    hoverBackgroundColor:
                        "#dc2626",

                    borderRadius:
                        5,

                    borderSkipped:
                        false,

                    barThickness:
                        15,

                    maxBarThickness:
                        15

                }

            ]

        },


        // =====================================================
        // OPCIONES
        // =====================================================

        options: {

            indexAxis:
                "y",

            responsive:
                true,

            maintainAspectRatio:
                false,


            // =================================================
            // ANIMACIÓN
            // =================================================

            animation: {

                duration:
                    500,

                easing:
                    "easeOutQuart"

            },


            // =================================================
            // INTERACCIÓN
            // =================================================

            interaction: {

                mode:
                    "nearest",

                axis:
                    "y",

                intersect:
                    false

            },


            // =================================================
            // LAYOUT
            // =================================================

            layout: {

                padding: {

                    top:
                        5,

                    right:
                        30,

                    bottom:
                        20,

                    left:
                        5

                }

            },


            // =================================================
            // EJES
            // =================================================

            scales: {

                // =================================================
                // X
                // =================================================

                x: {

                    beginAtZero:
                        true,

                    grace:
                        "8%",


                    border: {

                        display:
                            false

                    },


                    grid: {

                        color:
                            "rgba(148, 163, 184, 0.15)",

                        drawTicks:
                            false

                    },


                    ticks: {

                        precision:
                            0,

                        color:
                            "#64748b",

                        padding:
                            6,


                        font: {

                            size:
                                10,

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


                // =================================================
                // Y
                // =================================================

                y: {

                    offset:
                        true,

                    stacked:
                        false,


                    afterFit:
                        function (scale) {

                            /*
                             * Espacio para:
                             *
                             * Fecha
                             * Digitador
                             */

                            scale.width =
                                210;

                        },


                    border: {

                        display:
                            false

                    },


                    grid: {

                        display:
                            false

                    },


                    ticks: {

                        autoSkip:
                            false,

                        color:
                            "#334155",

                        padding:
                            10,


                        font: {

                            size:
                                10,

                            weight:
                                "600"

                        },


                        callback:
                            function (value) {

                                const item =
                                    this.chart
                                        .data
                                        .labels[value];


                                if (!item) {

                                    return "";

                                }


                                return [

                                    item.fecha,

                                    item.auditor

                                ];

                            }

                    }

                }

            },


            // =====================================================
            // PLUGINS
            // =====================================================

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
                            9,

                        boxHeight:
                            9,

                        padding:
                            18,

                        color:
                            "#334155",


                        font: {

                            size:
                                11,

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
                        12,

                    displayColors:
                        true,

                    boxPadding:
                        5,


                    callbacks: {


                        // =========================================
                        // TÍTULO
                        // =========================================

                        title:
                            function (items) {

                                if (
                                    !items.length
                                ) {

                                    return "";

                                }


                                const index =
                                    items[0]
                                        .dataIndex;


                                const item =
                                    datos[index];


                                return (
                                    `${item.fecha} · ` +
                                    `${item.auditor || "Sin digitador"}`
                                );

                            },


                        // =========================================
                        // VALOR
                        // =========================================

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

                            },


                        // =========================================
                        // TOTAL
                        // =========================================

                        afterBody:
                            function (items) {

                                if (
                                    !items.length
                                ) {

                                    return "";

                                }


                                const index =
                                    items[0]
                                        .dataIndex;


                                const item =
                                    datos[index];


                                return [

                                    "",

                                    `TOTAL: ${Number(
                                        item.total ||
                                        total[index] ||
                                        0
                                    ).toLocaleString(
                                        "es-CO"
                                    )}`

                                ];

                            }

                    }

                },


                // =================================================
                // DATALABELS
                // =================================================

                datalabels: {

                    display:
                        function (context) {

                            const valor =
                                Number(
                                    context.raw
                                ) || 0;


                            return valor >= 2;

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

                        size:
                            9,

                        weight:
                            "700"

                    },


                    formatter:
                        function (value) {

                            const numero =
                                Number(value) || 0;


                            if (
                                numero < 2
                            ) {

                                return "";

                            }


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


    console.log(
        `✅ Gráfica creada: ${datos.length} registros`
    );

});
