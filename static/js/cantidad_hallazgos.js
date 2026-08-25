document.addEventListener("DOMContentLoaded", function () {

    console.log("=== CANTIDAD DE HALLAZGOS POR TÉCNICO ===");


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const elemento =
        document.getElementById(
            "datos-Errores-Por-Hallazgo"
        );

    const canvas =
        document.getElementById(
            "graficaCantidadHallazgos"
        );

    const contenedor =
        document.querySelector(
            ".chart-container-hallazgos"
        );


    if (!elemento) {

        console.error(
            "❌ NO EXISTE #datos-Errores-Por-Hallazgo"
        );

        return;
    }


    if (!canvas) {

        console.error(
            "❌ NO EXISTE #graficaCantidadHallazgos"
        );

        return;
    }


    if (!contenedor) {

        console.error(
            "❌ NO EXISTE .chart-container-hallazgos"
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
            "❌ ERROR LEYENDO JSON:",
            error
        );

        return;
    }


    if (!Array.isArray(datos) || datos.length === 0) {

        console.warn(
            "⚠️ NO EXISTEN DATOS DE HALLAZGOS"
        );

        return;
    }


    // =====================================================
    // NORMALIZAR
    // =====================================================

    const estadisticas =
        datos.map(function (item) {

            const alto =
                Number(item.alto) || 0;

            const medio =
                Number(item.medio) || 0;

            const bajo =
                Number(item.bajo) || 0;

            const sinTipo =
                Number(item.sin_tipo) || 0;


            /*
             * Si Django ya envía total,
             * usamos ese valor.
             *
             * Si no, lo calculamos.
             */

            const total =
                Number(item.total) ||
                (
                    alto +
                    medio +
                    bajo +
                    sinTipo
                );


            return {

                tecnico:
                    String(
                        item.tecnico ||
                        "Sin técnico"
                    ).trim(),

                alto:
                    alto,

                medio:
                    medio,

                bajo:
                    bajo,

                sin_tipo:
                    sinTipo,

                total:
                    total

            };

        });


    // =====================================================
    // ORDENAR MAYOR A MENOR
    // =====================================================

    estadisticas.sort(
        function (a, b) {

            return b.total - a.total;

        }
    );


    console.table(
        estadisticas
    );


    // =====================================================
    // TOTALES GENERALES
    // =====================================================

    const totalGeneral =
        estadisticas.reduce(
            function (acumulado, item) {

                return acumulado + item.total;

            },
            0
        );


    const totalTecnicos =
        estadisticas.length;


    console.log(
        "👷 Técnicos:",
        totalTecnicos
    );

    console.log(
        "📊 Total hallazgos:",
        totalGeneral
    );


    // =====================================================
    // MOSTRAR TOTAL DE TÉCNICOS
    // =====================================================

    const elementoTotalTecnicos =
        document.getElementById(
            "totalTecnicosHallazgos"
        );


    if (elementoTotalTecnicos) {

        elementoTotalTecnicos.textContent =
            `${totalTecnicos.toLocaleString("es-CO")} técnicos`;

    }


    // =====================================================
    // LABELS
    // =====================================================

    const labels =
        estadisticas.map(
            function (item) {

                return item.tecnico;

            }
        );


    // =====================================================
    // DATASETS
    // =====================================================

    const alto =
        estadisticas.map(
            function (item) {

                return item.alto;

            }
        );


    const medio =
        estadisticas.map(
            function (item) {

                return item.medio;

            }
        );


    const bajo =
        estadisticas.map(
            function (item) {

                return item.bajo;

            }
        );


    // =====================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // =====================================================

    const graficaAnterior =
        Chart.getChart(canvas);


    if (graficaAnterior) {

        graficaAnterior.destroy();

    }


    // =====================================================
    // ALTURA REAL
    // =====================================================

    /*
     * IMPORTANTE:
     *
     * Antes Chart.js estaba tomando la altura
     * del contenedor de 550px.
     *
     * Ahora dejamos una altura REAL para cada técnico.
     *
     * 58px por técnico.
     */

    const espacioPorTecnico = 58;

    const alturaMinima = 500;

    const alturaMaxima = 7000;


    const altura =
        Math.min(
            alturaMaxima,
            Math.max(
                alturaMinima,
                estadisticas.length *
                espacioPorTecnico
            )
        );


    // =====================================================
    // CONFIGURAR CANVAS
    // =====================================================

    const ancho =
        contenedor.clientWidth;


    canvas.width =
        ancho;

    canvas.height =
        altura;


    canvas.style.width =
        `${ancho}px`;

    canvas.style.height =
        `${altura}px`;

    canvas.style.display =
        "block";


    // =====================================================
    // PLUGIN TOTAL
    // =====================================================

    const totalPlugin = {

        id:
            "totalHallazgosTecnico",


        afterDatasetsDraw:
            function (chart) {

                const ctx =
                    chart.ctx;


                /*
                 * Dataset 0 = Alto
                 * Dataset 1 = Medio
                 * Dataset 2 = Bajo
                 */

                const metaAlto =
                    chart.getDatasetMeta(0);

                const metaMedio =
                    chart.getDatasetMeta(1);

                const metaBajo =
                    chart.getDatasetMeta(2);


                ctx.save();


                ctx.font =
                    "700 11px Arial, sans-serif";

                ctx.textBaseline =
                    "middle";


                estadisticas.forEach(
                    function (item, index) {

                        let barra = null;


                        /*
                         * Buscamos el último segmento
                         * visible de la barra.
                         */

                        if (
                            item.bajo > 0 &&
                            metaBajo.data[index]
                        ) {

                            barra =
                                metaBajo.data[index];

                        }
                        else if (
                            item.medio > 0 &&
                            metaMedio.data[index]
                        ) {

                            barra =
                                metaMedio.data[index];

                        }
                        else if (
                            item.alto > 0 &&
                            metaAlto.data[index]
                        ) {

                            barra =
                                metaAlto.data[index];

                        }


                        if (
                            !barra ||
                            item.total <= 0
                        ) {

                            return;

                        }


                        const texto =
                            `Total: ${item.total.toLocaleString("es-CO")}`;


                        const anchoTexto =
                            ctx.measureText(
                                texto
                            ).width;


                        const x =
                            barra.x + 10;


                        const y =
                            barra.y;


                        // =================================================
                        // FONDO
                        // =================================================

                        ctx.fillStyle =
                            "#ffffff";


                        ctx.beginPath();


                        ctx.roundRect(
                            x,
                            y - 12,
                            anchoTexto + 14,
                            24,
                            6
                        );


                        ctx.fill();


                        // =================================================
                        // BORDE
                        // =================================================

                        ctx.strokeStyle =
                            "#dbe3ef";


                        ctx.lineWidth =
                            1;


                        ctx.stroke();


                        // =================================================
                        // TEXTO
                        // =================================================

                        ctx.fillStyle =
                            "#172554";


                        ctx.fillText(
                            texto,
                            x + 7,
                            y
                        );

                    }
                );


                ctx.restore();

            }

    };


    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    const grafica =
        new Chart(canvas, {

            type:
                "bar",


            data: {

                labels:
                    labels,


                datasets: [

                    // =============================================
                    // ALTO
                    // =============================================

                    {

                        label:
                            "Alto",

                        data:
                            alto,

                        backgroundColor:
                            "#ef4444",

                        hoverBackgroundColor:
                            "#dc2626",

                        borderRadius:
                            6,

                        borderSkipped:
                            false,

                        barThickness:
                            24,

                        maxBarThickness:
                            24

                    },


                    // =============================================
                    // MEDIO
                    // =============================================

                    {

                        label:
                            "Medio",

                        data:
                            medio,

                        backgroundColor:
                            "#f59e0b",

                        hoverBackgroundColor:
                            "#d97706",

                        borderRadius:
                            6,

                        borderSkipped:
                            false,

                        barThickness:
                            24,

                        maxBarThickness:
                            24

                    },


                    // =============================================
                    // BAJO
                    // =============================================

                    {

                        label:
                            "Bajo",

                        data:
                            bajo,

                        backgroundColor:
                            "#22c55e",

                        hoverBackgroundColor:
                            "#16a34a",

                        borderRadius:
                            6,

                        borderSkipped:
                            false,

                        barThickness:
                            24,

                        maxBarThickness:
                            24

                    }

                ]

            },


            // =====================================================
            // OPCIONES
            // =====================================================

            options: {

                /*
                 * IMPORTANTE:
                 *
                 * false permite que el canvas tenga
                 * una altura mayor que el contenedor.
                 *
                 * Así funciona correctamente el scroll.
                 */

                responsive:
                    false,

                maintainAspectRatio:
                    false,

                indexAxis:
                    "y",


                animation: {

                    duration:
                        600,

                    easing:
                        "easeOutQuart"

                },


                interaction: {

                    mode:
                        "index",

                    axis:
                        "y",

                    intersect:
                        false

                },


                layout: {

                    padding: {

                        top:
                            10,

                        right:
                            115,

                        bottom:
                            25,

                        left:
                            5

                    }

                },


                // =================================================
                // EJES
                // =================================================

                scales: {

                    // =============================================
                    // X
                    // =============================================

                    x: {

                        stacked:
                            true,

                        beginAtZero:
                            true,

                        grace:
                            "12%",


                        border: {

                            display:
                                false

                        },


                        grid: {

                            color:
                                "rgba(148, 163, 184, 0.18)",

                            drawTicks:
                                false

                        },


                        ticks: {

                            precision:
                                0,

                            color:
                                "#374151",

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
                    // Y
                    // =============================================

                    y: {

                        stacked:
                            true,

                        offset:
                            true,


                        border: {

                            display:
                                false

                        },


                        grid: {

                            display:
                                false

                        },


                        afterFit:
                            function (scale) {

                                /*
                                 * Espacio suficiente para
                                 * nombres largos.
                                 */

                                scale.width =
                                    245;

                            },


                        ticks: {

                            color:
                                "#172554",

                            padding:
                                12,

                            autoSkip:
                                false,


                            font: {

                                size:
                                    11,

                                weight:
                                    "700"

                            },


                            callback:
                                function (value) {

                                    const nombre =
                                        this.getLabelForValue(
                                            value
                                        );


                                    if (!nombre) {

                                        return "";

                                    }


                                    /*
                                     * Cortamos nombres
                                     * excesivamente largos.
                                     */

                                    if (
                                        nombre.length > 38
                                    ) {

                                        return (
                                            nombre.substring(
                                                0,
                                                38
                                            ) +
                                            "..."
                                        );

                                    }


                                    return nombre;

                                }

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
                                18,

                            color:
                                "#334155",


                            font: {

                                size:
                                    11,

                                weight:
                                    "700"

                            }

                        }

                    },


                    // =============================================
                    // TOOLTIP
                    // =============================================

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

                            // =====================================
                            // TÍTULO
                            // =====================================

                            title:
                                function (items) {

                                    if (
                                        !items.length
                                    ) {

                                        return "";

                                    }


                                    return (
                                        "👷 " +
                                        items[0].label
                                    );

                                },


                            // =====================================
                            // VALORES
                            // =====================================

                            label:
                                function (context) {

                                    const valor =
                                        Number(
                                            context.raw
                                        ) || 0;


                                    if (
                                        valor <= 0
                                    ) {

                                        return null;

                                    }


                                    return (
                                        ` ${context.dataset.label}: ` +
                                        valor.toLocaleString(
                                            "es-CO"
                                        ) +
                                        " hallazgos"
                                    );

                                },


                            // =====================================
                            // TOTAL
                            // =====================================

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
                                        estadisticas[
                                            index
                                        ];


                                    return [

                                        "",

                                        "━━━━━━━━━━━━━━━━",

                                        `TOTAL: ${item.total.toLocaleString("es-CO")} hallazgos`

                                    ];

                                }

                        }

                    },


                    // =============================================
                    // NÚMEROS SOBRE LAS BARRAS
                    // =============================================

                    datalabels: {

                        /*
                         * Solo mostramos números
                         * cuando el segmento tenga
                         * al menos 2.
                         */

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
                                10,

                            weight:
                                "700"

                        },


                        formatter:
                            function (value) {

                                const numero =
                                    Number(
                                        value
                                    ) || 0;


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

                ChartDataLabels,

                totalPlugin

            ]

        });


    // =====================================================
    // RESIZE
    // =====================================================

    /*
     * Si cambia el tamaño de la pantalla,
     * actualizamos el ancho del canvas.
     */

    let resizeTimer;


    window.addEventListener(
        "resize",
        function () {

            clearTimeout(
                resizeTimer
            );


            resizeTimer =
                setTimeout(
                    function () {

                        const nuevoAncho =
                            contenedor.clientWidth;


                        canvas.width =
                            nuevoAncho;


                        canvas.style.width =
                            `${nuevoAncho}px`;


                        grafica.resize(
                            nuevoAncho,
                            altura
                        );

                    },
                    150
                );

        }
    );


    console.log(
        `✅ GRÁFICA CREADA: ${estadisticas.length} técnicos`
    );

});
