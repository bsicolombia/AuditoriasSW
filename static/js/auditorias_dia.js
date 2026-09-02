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


    // =====================================================
    // VALIDAR
    // =====================================================

    if (!elemento) {

        console.error(
            "❌ No existe #datos-Auditoria_Dia"
        );

        return;
    }


    if (!canvas) {

        console.error(
            "❌ No existe #graficaAuditoriasDia"
        );

        return;
    }


    // =====================================================
    // LEER JSON
    // =====================================================

    let datos = [];

    try {

        const contenido =
            elemento.textContent.trim();


        if (!contenido) {

            console.warn(
                "⚠️ El elemento de datos está vacío"
            );

            return;
        }


        datos =
            JSON.parse(contenido);

    } catch (error) {

        console.error(
            "❌ Error leyendo JSON:",
            error
        );

        console.error(
            "Contenido recibido:",
            elemento.textContent
        );

        return;
    }


    // =====================================================
    // VALIDAR ARRAY
    // =====================================================

    if (!Array.isArray(datos)) {

        console.error(
            "❌ Los datos no son un Array"
        );

        return;
    }


    if (datos.length === 0) {

        console.warn(
            "⚠️ No existen datos para Auditorías por día"
        );

        return;
    }


    // =====================================================
    // NORMALIZAR
    // =====================================================

    datos =
        datos.map(function (item) {

            const cumple =
                Number(
                    item.cumple ??
                    item.cumplen
                ) || 0;


            const noCumple =
                Number(
                    item.no_cumple ??
                    item.noCumple
                ) || 0;


            let total =
                Number(
                    item.total
                ) || 0;


            if (total <= 0) {

                total =
                    cumple +
                    noCumple;

            }


            return {

                fecha:
                    String(
                        item.fecha ||
                        ""
                    ).trim(),

                total:
                    total,

                cumple:
                    cumple,

                noCumple:
                    noCumple

            };

        });


    // =====================================================
    // ORDENAR
    // MÁS RECIENTE → MÁS ANTIGUA
    // =====================================================

    datos.sort(function (a, b) {

        const fechaA =
            new Date(a.fecha);

        const fechaB =
            new Date(b.fecha);


        return fechaB - fechaA;

    });


    // =====================================================
    // ARRAYS
    // =====================================================

    const labels =
        datos.map(function (item) {

            return item.fecha;

        });


    const total =
        datos.map(function (item) {

            return item.total;

        });


    const cumple =
        datos.map(function (item) {

            return item.cumple;

        });


    const noCumple =
        datos.map(function (item) {

            return item.noCumple;

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
     * IMPORTANTE:
     *
     * Aumentamos bastante el espacio vertical
     * de cada día porque ahora queremos separar
     *
     *     TOTAL
     *     CUMPLEN
     *     NO CUMPLEN
     *
     * visualmente.
     */

    const alturaPorDia =
        120;


    const alturaMinima =
        500;


    const alturaMaxima =
        6000;


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

    canvas.style.boxSizing =
        "border-box";


    // =====================================================
    // MÁXIMO DEL EJE X
    // =====================================================

    const maximo =
        Math.max.apply(
            null,
            total
        );


    const maximoEje =
        maximo > 0
            ? maximo * 1.22
            : 10;


    // =====================================================
    // PLUGIN
    // NÚMEROS FUERA DE LAS BARRAS
    // =====================================================

    const numerosFueraBarra = {

        id:
            "numerosFueraBarraAuditoriasDia",


        afterDatasetsDraw:
            function (chart) {

                const ctx =
                    chart.ctx;


                ctx.save();


                ctx.textBaseline =
                    "middle";


                chart.data.datasets.forEach(
                    function (
                        dataset,
                        datasetIndex
                    ) {


                        const meta =
                            chart.getDatasetMeta(
                                datasetIndex
                            );


                        if (
                            !meta ||
                            !meta.data
                        ) {

                            return;

                        }


                        meta.data.forEach(
                            function (
                                barra,
                                index
                            ) {


                                const valor =
                                    Number(
                                        dataset.data[index]
                                    ) || 0;


                                if (
                                    valor <= 0 ||
                                    !barra
                                ) {

                                    return;

                                }


                                // =====================================
                                // TEXTO
                                // =====================================

                                const texto =
                                    valor.toLocaleString(
                                        "es-CO"
                                    );


                                ctx.font =
                                    "800 10px Arial, sans-serif";


                                const anchoTexto =
                                    ctx.measureText(
                                        texto
                                    ).width;


                                // =====================================
                                // CAJA
                                // =====================================

                                const paddingX =
                                    6;


                                const anchoCaja =
                                    anchoTexto +
                                    (
                                        paddingX *
                                        2
                                    );


                                const altoCaja =
                                    20;


                                // =====================================
                                // POSICIÓN
                                // =====================================

                                const x =
                                    barra.x + 8;


                                const y =
                                    barra.y;


                                // =====================================
                                // COLORES
                                // =====================================

                                let colorBorde =
                                    "#bfdbfe";


                                let colorTexto =
                                    "#172554";


                                if (
                                    datasetIndex === 1
                                ) {

                                    colorBorde =
                                        "#bbf7d0";

                                    colorTexto =
                                        "#15803d";

                                }


                                if (
                                    datasetIndex === 2
                                ) {

                                    colorBorde =
                                        "#fed7aa";

                                    colorTexto =
                                        "#c2410c";

                                }


                                // =====================================
                                // FONDO
                                // =====================================

                                ctx.fillStyle =
                                    "#ffffff";


                                ctx.beginPath();


                                ctx.roundRect(
                                    x,
                                    y -
                                    (
                                        altoCaja /
                                        2
                                    ),
                                    anchoCaja,
                                    altoCaja,
                                    5
                                );


                                ctx.fill();


                                // =====================================
                                // BORDE
                                // =====================================

                                ctx.strokeStyle =
                                    colorBorde;


                                ctx.lineWidth =
                                    1;


                                ctx.stroke();


                                // =====================================
                                // TEXTO
                                // =====================================

                                ctx.fillStyle =
                                    colorTexto;


                                ctx.fillText(
                                    texto,
                                    x + paddingX,
                                    y
                                );

                            }
                        );

                    }
                );


                ctx.restore();

            }

    };


    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    new Chart(canvas, {

        type:
            "bar",


        data: {

            labels:
                labels,


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
                        "#2563eb",

                    hoverBackgroundColor:
                        "#1d4ed8",

                    borderRadius:
                        6,

                    borderSkipped:
                        false,

                    /*
                     * NO usar barThickness.
                     *
                     * Chart.js calculará la posición
                     * de cada barra automáticamente.
                     */

                    categoryPercentage:
                        0.82,

                    barPercentage:
                        0.48

                },


                // =================================================
                // CUMPLEN
                // =================================================

                {

                    label:
                        "Cumplen",

                    data:
                        cumple,

                    backgroundColor:
                        "#22c55e",

                    hoverBackgroundColor:
                        "#16a34a",

                    borderRadius:
                        6,

                    borderSkipped:
                        false,

                    categoryPercentage:
                        0.82,

                    barPercentage:
                        0.48

                },


                // =================================================
                // NO CUMPLEN
                // =================================================

                {

                    label:
                        "No cumplen",

                    data:
                        noCumple,

                    backgroundColor:
                        "#f97316",

                    hoverBackgroundColor:
                        "#ea580c",

                    borderRadius:
                        6,

                    borderSkipped:
                        false,

                    categoryPercentage:
                        0.82,

                    barPercentage:
                        0.48

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
                        90,

                    bottom:
                        25,

                    left:
                        10

                }

            },


            // =====================================================
            // EJES
            // =====================================================

            scales: {


                // =================================================
                // EJE X
                // =================================================

                x: {

                    beginAtZero:
                        true,


                    max:
                        maximoEje,


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


                // =================================================
                // EJE Y
                // =================================================

                y: {

                    offset:
                        true,


                    stacked:
                        false,


                    afterFit:
                        function (scale) {

                            scale.width =
                                window.innerWidth <= 600
                                    ? 120
                                    : 160;

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


                                const item =
                                    datos[index];


                                return [

                                    "",

                                    `TOTAL: ${item.total.toLocaleString(
                                        "es-CO"
                                    )}`,

                                    `CUMPLEN: ${item.cumple.toLocaleString(
                                        "es-CO"
                                    )}`,

                                    `NO CUMPLEN: ${item.noCumple.toLocaleString(
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
                        false

                }

            }

        },


        // =====================================================
        // PLUGIN PERSONALIZADO
        // =====================================================

        plugins: [

            numerosFueraBarra

        ]

    });


    // =====================================================
    // FINAL
    // =====================================================

    console.log(
        `✅ Auditorías por día creada correctamente: ${datos.length} días`
    );

});
