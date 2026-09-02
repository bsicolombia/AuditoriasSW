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


    // =====================================================
    // VALIDAR ELEMENTOS
    // =====================================================

    if (!elemento) {

        console.error(
            "❌ No existe #datos-Auditorias-Por-Digitador"
        );

        return;
    }


    if (!canvas) {

        console.error(
            "❌ No existe #graficaAuditoriasDigitador"
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
            "❌ Los datos recibidos NO son un Array:",
            datos
        );

        return;
    }


    // =====================================================
    // NORMALIZAR DATOS
    // =====================================================

    datos = datos.map(function (item) {

        const cumple =
            Number(
                item.cumple ??
                item.cumplen ??
                0
            ) || 0;


        const noCumple =
            Number(
                item.no_cumple ??
                item.noCumple ??
                0
            ) || 0;


        let total =
            Number(
                item.total
            ) || 0;


        // =================================================
        // CALCULAR TOTAL
        // =================================================

        if (total <= 0) {

            total =
                cumple +
                noCumple;

        }


        return {

            fecha:
                String(
                    item.fecha ??
                    ""
                ).trim(),


            auditor:
                String(
                    item.auditor ??
                    item.digitador ??
                    "Sin digitador"
                ).trim(),


            total:
                total,


            cumple:
                cumple,


            no_cumple:
                noCumple

        };

    });


    // =====================================================
    // ELIMINAR REGISTROS VACÍOS
    // =====================================================

    datos =
        datos.filter(function (item) {

            return (
                item.total > 0 ||
                item.cumple > 0 ||
                item.no_cumple > 0
            );

        });


    // =====================================================
    // VALIDAR
    // =====================================================

    if (datos.length === 0) {

        console.warn(
            "⚠️ No existen datos de digitadores para mostrar"
        );

        return;
    }


    // =====================================================
    // ORDENAR
    // =====================================================

    datos.sort(function (a, b) {

        const tiempoA = new Date(
            a.fecha 
        ).getTime();

        const tiempoB = new Date (
            b.fecha
        ).getTime();

        if (
            !isNaN(tiempoA) &&
            !isNaN(tiempoB) &&
            tiempoA !== tiempoB
        ){
            return tiempoB - tiempoA;
        }

        return a.auditor.localeCompare(
            b.auditor,
            "es",
            {
                sensitivity: "base"
            }
        );

    });

    // =====================================================
    // LABELS
    // =====================================================

    const labels =
        datos.map(function (item) {

            return {

                fecha:
                    item.fecha,

                auditor:
                    item.auditor

            };

        });


    // =====================================================
    // DATOS
    // =====================================================

    const total =
        datos.map(function (item) {

            return Number(
                item.total
            ) || 0;

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


    // =====================================================
    // LOG
    // =====================================================

    console.log(
        "👤 Digitadores:",
        labels.map(
            item => item.auditor
        )
    );

    console.log(
        "🔵 Total:",
        total
    );

    console.log(
        "🟢 Cumple:",
        cumple
    );

    console.log(
        "🔴 No cumple:",
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
    // ALTURA DINÁMICA
    // =====================================================

    /*
     * Aumentamos la altura por registro
     * para que los grupos tengan aire
     * entre sí.
     */

    const alturaPorRegistro =
        85;


    const alturaMinima =
        450;


    const alturaMaxima =
        5000;


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


    canvas.style.minHeight =
        `${altura}px`;


    canvas.style.width =
        "100%";


    canvas.style.maxWidth =
        "100%";


    canvas.style.display =
        "block";


    canvas.style.boxSizing =
        "border-box";


    // =====================================================
    // MÁXIMO DEL EJE X
    // =====================================================

    const mayorValor =
        Math.max(
            ...total,
            ...cumple,
            ...noCumple,
            0
        );


    const maximoEje =
        mayorValor > 0
            ? mayorValor * 1.25
            : 10;


    // =====================================================
    // PLUGIN
    // NÚMEROS FUERA DE LAS BARRAS
    // =====================================================

    const valoresFueraPlugin = {

        id:
            "valoresFueraAuditoriasDigitador",


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

                                if (!barra) {

                                    return;

                                }


                                const valor =
                                    Number(
                                        dataset.data[index]
                                    ) || 0;


                                // =================================
                                // NO MOSTRAR CEROS
                                // =================================

                                if (
                                    valor <= 0
                                ) {

                                    return;

                                }


                                // =================================
                                // TEXTO
                                // =================================

                                const texto =
                                    valor.toLocaleString(
                                        "es-CO"
                                    );


                                // =================================
                                // FUENTE
                                // =================================

                                ctx.font =
                                    "800 10px Arial, sans-serif";


                                const anchoTexto =
                                    ctx.measureText(
                                        texto
                                    ).width;


                                // =================================
                                // CAJA
                                // =================================

                                const paddingHorizontal =
                                    7;


                                const anchoCaja =
                                    anchoTexto +
                                    (
                                        paddingHorizontal *
                                        2
                                    );


                                const altoCaja =
                                    20;


                                // =================================
                                // POSICIÓN
                                // =================================

                                const x =
                                    barra.x +
                                    7;


                                const y =
                                    barra.y -
                                    (
                                        altoCaja /
                                        2
                                    );


                                // =================================
                                // COLORES
                                // =================================

                                let colorBorde =
                                    "#cbd5e1";


                                let colorTexto =
                                    "#334155";


                                if (
                                    dataset.label ===
                                    "Total"
                                ) {

                                    colorBorde =
                                        "#bfdbfe";

                                    colorTexto =
                                        "#172554";

                                }


                                if (
                                    dataset.label ===
                                    "Cumple"
                                ) {

                                    colorBorde =
                                        "#bbf7d0";

                                    colorTexto =
                                        "#166534";

                                }


                                if (
                                    dataset.label ===
                                    "No cumple"
                                ) {

                                    colorBorde =
                                        "#fecaca";

                                    colorTexto =
                                        "#991b1b";

                                }


                                // =================================
                                // FONDO
                                // =================================

                                ctx.fillStyle =
                                    "#ffffff";


                                ctx.beginPath();


                                if (
                                    typeof ctx.roundRect ===
                                    "function"
                                ) {

                                    ctx.roundRect(
                                        x,
                                        y,
                                        anchoCaja,
                                        altoCaja,
                                        5
                                    );

                                } else {

                                    ctx.rect(
                                        x,
                                        y,
                                        anchoCaja,
                                        altoCaja
                                    );

                                }


                                ctx.fill();


                                // =================================
                                // BORDE
                                // =================================

                                ctx.strokeStyle =
                                    colorBorde;


                                ctx.lineWidth =
                                    1;


                                ctx.stroke();


                                // =================================
                                // NÚMERO
                                // =================================

                                ctx.fillStyle =
                                    colorTexto;


                                ctx.textAlign =
                                    "left";


                                ctx.fillText(
                                    texto,
                                    x +
                                    paddingHorizontal,
                                    barra.y
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

                    borderColor:
                        "#172554",

                    borderWidth:
                        0,

                    borderRadius:
                        6,

                    borderSkipped:
                        false,


                    /*
                     * =================================================
                     * SEPARACIÓN DE BARRAS
                     * =================================================
                     *
                     * NO usar barThickness.
                     *
                     * categoryPercentage:
                     * controla el espacio vertical del grupo.
                     *
                     * barPercentage:
                     * controla cuánto ocupa cada barra
                     * dentro de ese grupo.
                     *
                     * Al usar 0.55 queda espacio visible
                     * entre Total, Cumple y No cumple.
                     */

                    categoryPercentage:
                        0.62,

                    barPercentage:
                        0.55

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

                    borderColor:
                        "#166534",

                    borderWidth:
                        0,

                    borderRadius:
                        6,

                    borderSkipped:
                        false,


                    categoryPercentage:
                        0.62,

                    barPercentage:
                        0.55

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

                    borderColor:
                        "#991b1b",

                    borderWidth:
                        0,

                    borderRadius:
                        6,

                    borderSkipped:
                        false,


                    categoryPercentage:
                        0.62,

                    barPercentage:
                        0.55

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
                        10,

                    right:
                        90,

                    bottom:
                        20,

                    left:
                        5

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
                                    ? 170
                                    : 210;

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
                                    `${item.fecha || "Sin fecha"} · ` +
                                    `${item.auditor || "Sin digitador"}`
                                );

                            },


                        // =========================================
                        // VALORES
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
                        // RESUMEN
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
                                        item.total
                                    ).toLocaleString(
                                        "es-CO"
                                    )}`,

                                    `CUMPLE: ${Number(
                                        item.cumple
                                    ).toLocaleString(
                                        "es-CO"
                                    )}`,

                                    `NO CUMPLE: ${Number(
                                        item.no_cumple
                                    ).toLocaleString(
                                        "es-CO"
                                    )}`

                                ];

                            }

                    }

                },


                // =================================================
                // DESACTIVAR CHARTDATALABELS
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

            valoresFueraPlugin

        ]

    });


    // =====================================================
    // FINAL
    // =====================================================

    console.log(
        `✅ Gráfica de auditorías por digitador creada correctamente: ${datos.length} registros`
    );

});
