document.addEventListener("DOMContentLoaded", function () {

    console.log("=== CANTIDAD DE AUDITORÍAS POR AUDITOR ===");


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const elemento =
        document.getElementById(
            "datos-Cantidad-Auditorias-Auditor"
        );


    const canvas =
        document.getElementById(
            "graficaCantidadAuditoriasAuditor"
        );


    // =====================================================
    // VALIDAR ELEMENTOS
    // =====================================================

    if (!elemento) {

        console.error(
            "❌ No existe #datos-Cantidad-Auditorias-Auditor"
        );

        return;

    }


    if (!canvas) {

        console.error(
            "❌ No existe #graficaCantidadAuditoriasAuditor"
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
            "❌ Los datos no son un Array:",
            datos
        );

        return;

    }


    if (datos.length === 0) {

        console.warn(
            "⚠️ No hay datos de auditorías por auditor"
        );

        return;

    }


    console.log(
        "📊 Datos recibidos:",
        datos
    );

    console.table(datos);


    // =====================================================
    // PREPARAR DATOS
    // =====================================================

    const datosOrdenados = datos

        .map(function (item) {

            return {

                auditor:
                    String(
                        item.auditor ||
                        "Sin auditor"
                    ).trim(),

                total:
                    Number(item.total) || 0,

                cumple:
                    Number(item.cumple) || 0,

                no_cumple:
                    Number(item.no_cumple) || 0

            };

        })


        // =================================================
        // ORDENAR
        // MAYOR TOTAL → MENOR TOTAL
        // =================================================

        .sort(function (a, b) {

            return (
                b.total -
                a.total
            );

        });


    // =====================================================
    // LABELS
    // =====================================================

    const labels =
        datosOrdenados.map(function (item) {

            return item.auditor;

        });


    // =====================================================
    // TOTAL
    // =====================================================

    const total =
        datosOrdenados.map(function (item) {

            return item.total;

        });


    // =====================================================
    // CUMPLE
    // =====================================================

    const cumple =
        datosOrdenados.map(function (item) {

            return item.cumple;

        });


    // =====================================================
    // NO CUMPLE
    // =====================================================

    const noCumple =
        datosOrdenados.map(function (item) {

            return item.no_cumple;

        });


    // =====================================================
    // VERIFICAR DATOS
    // =====================================================

    console.log(
        "👤 Auditores:",
        labels
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
     * Más espacio vertical por auditor.
     *
     * Como tenemos 3 barras por auditor,
     * necesitamos suficiente espacio para
     * que no queden pegadas.
     */

    const alturaPorAuditor =
        90;


    const alturaMinima =
        500;


    const alturaMaxima =
        4500;


    const altura =
        Math.min(

            alturaMaxima,

            Math.max(

                alturaMinima,

                datosOrdenados.length *
                alturaPorAuditor

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

    const maximo =
        Math.max.apply(
            null,
            total
        );


    /*
     * Espacio adicional para los números
     * que aparecen después de las barras.
     */

    const maximoEje =

        maximo > 0

            ? maximo * 1.25

            : 10;


    // =====================================================
    // PLUGIN
    // NÚMEROS FUERA DE LAS BARRAS
    // =====================================================

    const cantidadesPlugin = {

        id:
            "cantidadesAuditor",


        afterDatasetsDraw:
            function (chart) {

                const ctx =
                    chart.ctx;


                ctx.save();


                ctx.textBaseline =
                    "middle";


                // =================================================
                // RECORRER DATASETS
                // =================================================

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


                        // =================================================
                        // RECORRER BARRAS
                        // =================================================

                        meta.data.forEach(
                            function (
                                barra,
                                index
                            ) {

                                const valor =
                                    Number(
                                        dataset.data[index]
                                    ) || 0;


                                // -----------------------------------------
                                // NO MOSTRAR CEROS
                                // -----------------------------------------

                                if (
                                    valor <= 0
                                ) {

                                    return;

                                }


                                // -----------------------------------------
                                // TEXTO
                                // -----------------------------------------

                                const texto =
                                    valor.toLocaleString(
                                        "es-CO"
                                    );


                                // -----------------------------------------
                                // FUENTE
                                // -----------------------------------------

                                ctx.font =
                                    "800 10px Arial";


                                const anchoTexto =
                                    ctx.measureText(
                                        texto
                                    ).width;


                                // -----------------------------------------
                                // DIMENSIONES
                                // -----------------------------------------

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


                                // -----------------------------------------
                                // POSICIÓN
                                // -----------------------------------------

                                const x =
                                    barra.x + 8;


                                const y =
                                    barra.y;


                                // -----------------------------------------
                                // COLORES
                                // -----------------------------------------

                                let colorBorde =
                                    "#bfdbfe";


                                let colorTexto =
                                    "#172554";


                                // CUMPLE
                                if (
                                    datasetIndex === 1
                                ) {

                                    colorBorde =
                                        "#bbf7d0";

                                    colorTexto =
                                        "#15803d";

                                }


                                // NO CUMPLE
                                if (
                                    datasetIndex === 2
                                ) {

                                    colorBorde =
                                        "#fecaca";

                                    colorTexto =
                                        "#b91c1c";

                                }


                                // -----------------------------------------
                                // FONDO
                                // -----------------------------------------

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


                                // -----------------------------------------
                                // BORDE
                                // -----------------------------------------

                                ctx.strokeStyle =
                                    colorBorde;


                                ctx.lineWidth =
                                    1;


                                ctx.stroke();


                                // -----------------------------------------
                                // NÚMERO
                                // -----------------------------------------

                                ctx.fillStyle =
                                    colorTexto;


                                ctx.fillText(

                                    texto,

                                    x +
                                    paddingX,

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


        // =================================================
        // DATOS
        // =================================================

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
                        "#1e3a8a",

                    borderColor:
                        "#172554",

                    borderWidth:
                        0,

                    borderRadius:
                        6,

                    borderSkipped:
                        false,


                    /*
                     * IMPORTANTE:
                     *
                     * NO usamos barThickness.
                     *
                     * categoryPercentage controla
                     * el espacio utilizado por el grupo.
                     *
                     * barPercentage controla
                     * el ancho individual de cada barra.
                     */

                    categoryPercentage:
                        0.72,

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
                        0.72,

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
                        0.72,

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
                        100,

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


                // =============================================
                // EJE X
                // =============================================

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


                // =============================================
                // EJE Y
                // =============================================

                y: {

                    /*
                     * Cada auditor ocupa una categoría
                     * vertical independiente.
                     */

                    offset:
                        true,

                    stacked:
                        false,


                    afterFit:
                        function (scale) {

                            scale.width =
                                window.innerWidth <= 600
                                    ? 190
                                    : 250;

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

                                const nombre =
                                    this.getLabelForValue(
                                        value
                                    );


                                if (
                                    !nombre
                                ) {

                                    return "";

                                }


                                // -----------------------------------------
                                // NOMBRES LARGOS
                                // -----------------------------------------

                                if (
                                    nombre.length <= 30
                                ) {

                                    return nombre;

                                }


                                const posicion =
                                    nombre.lastIndexOf(
                                        " ",
                                        30
                                    );


                                if (
                                    posicion > 0
                                ) {

                                    return [

                                        nombre.substring(
                                            0,
                                            posicion
                                        ),

                                        nombre.substring(
                                            posicion + 1
                                        )

                                    ];

                                }


                                return [

                                    nombre.substring(
                                        0,
                                        30
                                    ),

                                    nombre.substring(
                                        30
                                    )

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
                                    datosOrdenados[
                                        index
                                    ];


                                return (
                                    "👤 Auditor: " +
                                    item.auditor
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
                                    datosOrdenados[
                                        index
                                    ];


                                return [

                                    "",

                                    `TOTAL: ${item.total.toLocaleString(
                                        "es-CO"
                                    )}`,

                                    `CUMPLE: ${item.cumple.toLocaleString(
                                        "es-CO"
                                    )}`,

                                    `NO CUMPLE: ${item.no_cumple.toLocaleString(
                                        "es-CO"
                                    )}`

                                ];

                            }

                    }

                },


                // =================================================
                // CHART DATALABELS
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

            cantidadesPlugin

        ]

    });


    // =====================================================
    // FINAL
    // =====================================================

    console.log(
        `✅ Gráfica creada correctamente: ${datosOrdenados.length} auditores`
    );

});
