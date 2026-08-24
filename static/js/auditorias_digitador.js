document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById(
        "datos-Auditorias-Por-Digitador"
    );

    const canvas = document.getElementById(
        "graficaAuditoriasDigitador"
    );


    // =====================================================
    // VALIDAR ELEMENTOS
    // =====================================================

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
    // VALIDAR DATOS
    // =====================================================

    if (!Array.isArray(datos) || datos.length === 0) {

        console.warn(
            "⚠️ No existen datos para mostrar"
        );

        return;
    }


    // =====================================================
    // DATOS
    // =====================================================

    const labels = datos.map(function (item) {

        return {
            fecha: item.fecha || "",
            auditor: item.auditor || ""
        };

    });


    const cumple = datos.map(function (item) {

        return Number(item.cumple) || 0;

    });


    const noCumple = datos.map(function (item) {

        return Number(item.no_cumple) || 0;

    });


    const total = datos.map(function (item) {

        return Number(item.total) || 0;

    });


    // =====================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // =====================================================

    const anterior = Chart.getChart(canvas);

    if (anterior) {

        anterior.destroy();

    }


    // =====================================================
    // ALTURA REAL DE LA GRÁFICA
    // =====================================================

    /*
     * ESTA ES LA PARTE MÁS IMPORTANTE.
     *
     * Cada registro tiene 82px.
     *
     * Ejemplo:
     *
     * 10 registros  = 820px
     * 20 registros  = 1640px
     * 30 registros  = 2460px
     *
     * El contenedor seguirá teniendo 500px
     * y aparecerá el scroll.
     */

    const alturaPorRegistro = 82;

    const alturaMinima = 520;


    const altura =
        Math.max(
            alturaMinima,
            datos.length * alturaPorRegistro
        );


    canvas.style.height =
        `${altura}px`;

    canvas.style.width =
        "100%";

    canvas.style.display =
        "block";


    // =====================================================
    // PLUGIN PARA MOSTRAR TOTAL
    // =====================================================

    const totalPlugin = {

        id: "totalPlugin",


        afterDatasetsDraw: function (chart) {

            const ctx = chart.ctx;


            const metaCumple =
                chart.getDatasetMeta(0);

            const metaNoCumple =
                chart.getDatasetMeta(1);


            ctx.save();


            ctx.font =
                "700 11px Arial, sans-serif";

            ctx.textBaseline =
                "middle";


            datos.forEach(function (item, index) {

                const barraCumple =
                    metaCumple.data[index];

                const barraNoCumple =
                    metaNoCumple.data[index];


                if (!barraCumple) {

                    return;

                }


                /*
                 * Obtener el extremo derecho
                 * de toda la barra.
                 */

                let x =
                    barraCumple.x;


                if (
                    barraNoCumple &&
                    barraNoCumple.x > x
                ) {

                    x =
                        barraNoCumple.x;

                }


                const y =
                    barraCumple.y;


                const valor =
                    Number(total[index]) || 0;


                const texto =
                    valor.toLocaleString(
                        "es-CO"
                    );


                const anchoTexto =
                    ctx.measureText(texto).width;


                /*
                 * Fondo del TOTAL
                 */

                ctx.fillStyle =
                    "#ffffff";


                ctx.beginPath();

                ctx.roundRect(
                    x + 9,
                    y - 11,
                    anchoTexto + 14,
                    22,
                    6
                );

                ctx.fill();


                ctx.strokeStyle =
                    "#dbe3ef";

                ctx.lineWidth = 1;

                ctx.stroke();


                /*
                 * TOTAL
                 */

                ctx.fillStyle =
                    "#334155";


                ctx.fillText(
                    texto,
                    x + 16,
                    y
                );

            });


            ctx.restore();

        }

    };


    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    new Chart(canvas, {

        type: "bar",


        data: {

            labels: labels,


            datasets: [

                // =================================================
                // CUMPLE
                // =================================================

                {

                    label: "Cumple",

                    data: cumple,

                    backgroundColor:
                        "#16c47f",

                    hoverBackgroundColor:
                        "#0ea968",

                    borderRadius: 7,

                    borderSkipped: false,

                    barThickness: 34,

                    maxBarThickness: 34,

                    stack: "auditorias"

                },


                // =================================================
                // NO CUMPLE
                // =================================================

                {

                    label: "No cumple",

                    data: noCumple,

                    backgroundColor:
                        "#ef4444",

                    hoverBackgroundColor:
                        "#dc2626",

                    borderRadius: 7,

                    borderSkipped: false,

                    barThickness: 34,

                    maxBarThickness: 34,

                    stack: "auditorias"

                }

            ]

        },


        // =====================================================
        // OPCIONES
        // =====================================================

        options: {

            indexAxis: "y",

            responsive: true,

            maintainAspectRatio: false,


            animation: {

                duration: 500,

                easing: "easeOutQuart"

            },


            interaction: {

                mode: "nearest",

                intersect: true

            },


            layout: {

                padding: {

                    top: 5,

                    right: 85,

                    bottom: 20,

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

                    stacked: true,

                    beginAtZero: true,

                    grace: "10%",


                    grid: {

                        color:
                            "rgba(148, 163, 184, 0.16)",

                        drawTicks: false,

                        lineWidth: 1

                    },


                    border: {

                        display: false

                    },


                    ticks: {

                        precision: 0,

                        color:
                            "#64748b",

                        padding: 9,


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

                    }

                },


                // =================================================
                // EJE Y
                // =================================================

                y: {

                    stacked: true,

                    offset: true,


                    /*
                     * Espacio para los nombres.
                     */

                    afterFit:
                        function (scale) {

                            scale.width = 235;

                        },


                    grid: {

                        display: false

                    },


                    border: {

                        display: false

                    },


                    ticks: {

                        padding: 12,

                        color:
                            "#334155",


                        font: {

                            size: 11,

                            weight: "600"

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


                                /*
                                 * DOS LÍNEAS
                                 *
                                 * Fecha
                                 * Digitador
                                 */

                                return [

                                    item.fecha,

                                    item.auditor

                                ];

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

                        boxWidth: 11,

                        boxHeight: 11,

                        padding: 22,

                        color:
                            "#334155",


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


                                const index =
                                    items[0]
                                        .dataIndex;


                                const item =
                                    datos[index];


                                return (
                                    `${item.fecha} - ` +
                                    `${item.auditor}`
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

                            },


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


                                return (
                                    "\n Total: " +
                                    Number(
                                        total[index]
                                    ).toLocaleString(
                                        "es-CO"
                                    )
                                );

                            }

                    }

                },


                // =================================================
                // DATOS DENTRO DE LAS BARRAS
                // =================================================

                datalabels: {

                    /*
                     * Solo mostrar números grandes.
                     *
                     * Los valores pequeños se dejan
                     * fuera para evitar amontonamiento.
                     */

                    display:
                        function (context) {

                            const valor =
                                Number(
                                    context.dataset
                                        .data[
                                            context.dataIndex
                                        ]
                                ) || 0;


                            return valor >= 10;

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

                        size: 10,

                        weight: "700"

                    },


                    formatter:
                        function (value) {

                            const numero =
                                Number(value) || 0;


                            if (
                                numero < 10
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

            ChartDataLabels,

            totalPlugin

        ]

    });


    console.log(
        `✅ Gráfica creada: ${datos.length} registros`
    );

});