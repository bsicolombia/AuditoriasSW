document.addEventListener("DOMContentLoaded", function () {

    console.log(
        "=== CANTIDAD DE HALLAZGOS ==="
    );


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const elemento =
        document.getElementById(
            "datos-Cantidad-Por-Hallazgo"
        );


    const canvas =
        document.getElementById(
            "graficaCantidadHallazgos"
        );


    const contenedor =
        document.querySelector(
            ".chart-container-hallazgos"
        );


    // =====================================================
    // VALIDACIONES
    // =====================================================

    if (!elemento) {

        console.error(
            "❌ NO EXISTE #datos-Cantidad-Por-Hallazgo"
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


    if (typeof Chart === "undefined") {

        console.error(
            "❌ Chart.js no está cargado"
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

        console.error(
            elemento.textContent
        );

        return;
    }


    console.log(
        "📦 DATOS RECIBIDOS:",
        datos
    );


    // =====================================================
    // VALIDAR DATOS
    // =====================================================

    if (!Array.isArray(datos)) {

        console.error(
            "❌ LOS DATOS NO SON UN ARRAY"
        );

        return;
    }


    if (datos.length === 0) {

        console.warn(
            "⚠️ NO HAY HALLAZGOS PARA MOSTRAR"
        );

        return;
    }


    // =====================================================
    // NORMALIZAR
    // =====================================================

    const estadisticas =
        datos
        .map(function (item) {

            return {

                hallazgo:
                    String(
                        item.hallazgo ||
                        "Sin hallazgo"
                    ).trim(),

                cantidad:
                    Number(
                        item.cantidad
                    ) || 0

            };

        })
        .filter(function (item) {

            return item.cantidad > 0;

        });


    // =====================================================
    // ORDENAR
    // =====================================================

    estadisticas.sort(
        function (a, b) {

            return (
                b.cantidad -
                a.cantidad
            );

        }
    );


    console.table(
        estadisticas
    );


    // =====================================================
    // LABELS
    // =====================================================

    const labels =
        estadisticas.map(
            function (item) {

                return item.hallazgo;

            }
        );


    // =====================================================
    // CANTIDADES
    // =====================================================

    const cantidades =
        estadisticas.map(
            function (item) {

                return item.cantidad;

            }
        );


    // =====================================================
    // TOTAL
    // =====================================================

    const totalGeneral =
        cantidades.reduce(
            function (total, cantidad) {

                return (
                    total +
                    cantidad
                );

            },
            0
        );


    console.log(
        "📊 TOTAL HALLAZGOS:",
        totalGeneral
    );


    console.log(
        "🔎 HALLAZGOS DIFERENTES:",
        estadisticas.length
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
    // ALTURA
    // =====================================================

    const espacioPorHallazgo = 55;

    const alturaMinima = 450;

    const alturaMaxima = 7000;


    const altura =
        Math.min(
            alturaMaxima,
            Math.max(
                alturaMinima,
                estadisticas.length *
                espacioPorHallazgo
            )
        );


    // =====================================================
    // ANCHO
    // =====================================================

    const ancho =
        contenedor.clientWidth;


    if (ancho <= 0) {

        console.error(
            "❌ EL CONTENEDOR NO TIENE ANCHO"
        );

        return;
    }


    // =====================================================
    // CANVAS
    // =====================================================

    canvas.width =
        ancho;

    canvas.height =
        altura;


    canvas.style.width =
        `${ancho}px`;

    canvas.style.height =
        `${altura}px`;


    // =====================================================
    // PLUGIN TOTAL
    // =====================================================

    const totalPlugin = {

        id:
            "totalHallazgo",

        afterDatasetsDraw:
            function (chart) {

                const ctx =
                    chart.ctx;

                const meta =
                    chart.getDatasetMeta(0);

                ctx.save();

                ctx.font =
                    "700 11px Arial";

                ctx.textBaseline =
                    "middle";


                estadisticas.forEach(
                    function (item, index) {

                        const barra =
                            meta.data[index];


                        if (!barra) {

                            return;

                        }


                        const texto =
                            item.cantidad.toLocaleString(
                                "es-CO"
                            );


                        const anchoTexto =
                            ctx.measureText(
                                texto
                            ).width;


                        const x =
                            barra.x + 10;


                        const y =
                            barra.y;


                        // Fondo

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


                        // Borde

                        ctx.strokeStyle =
                            "#dbe3ef";

                        ctx.lineWidth =
                            1;

                        ctx.stroke();


                        // Texto

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
        new Chart(
            canvas,
            {

                type:
                    "bar",

                data: {

                    labels:
                        labels,

                    datasets: [

                        {

                            label:
                                "Cantidad de hallazgos",

                            data:
                                cantidades,

                            backgroundColor:
                                "#2563eb",

                            hoverBackgroundColor:
                                "#1d4ed8",

                            borderRadius:
                                7,

                            borderSkipped:
                                false,

                            barThickness:
                                26,

                            maxBarThickness:
                                26

                        }

                    ]

                },


                options: {

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


                    layout: {

                        padding: {

                            top:
                                10,

                            right:
                                90,

                            bottom:
                                25,

                            left:
                                5

                        }

                    },


                    scales: {

                        x: {

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


                        y: {

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

                                    scale.width =
                                        300;

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


                                        if (
                                            !nombre
                                        ) {

                                            return "";

                                        }


                                        if (
                                            nombre.length > 50
                                        ) {

                                            return (
                                                nombre.substring(
                                                    0,
                                                    50
                                                ) +
                                                "..."
                                            );

                                        }


                                        return nombre;

                                    }

                            }

                        }

                    },


                    plugins: {

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


                        tooltip: {

                            backgroundColor:
                                "rgba(15, 23, 42, 0.97)",

                            titleColor:
                                "#ffffff",

                            bodyColor:
                                "#e2e8f0",

                            cornerRadius:
                                10,

                            padding:
                                13,


                            callbacks: {

                                title:
                                    function (items) {

                                        if (
                                            !items.length
                                        ) {

                                            return "";

                                        }


                                        return (
                                            "🔎 " +
                                            items[0].label
                                        );

                                    },


                                label:
                                    function (context) {

                                        return (
                                            " Cantidad: " +
                                            Number(
                                                context.raw
                                            ).toLocaleString(
                                                "es-CO"
                                            ) +
                                            " hallazgos"
                                        );

                                    }

                            }

                        },


                        datalabels: {

                            display:
                                function (context) {

                                    return (
                                        Number(
                                            context.raw
                                        ) > 0
                                    );

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

                                    return Number(
                                        value
                                    ).toLocaleString(
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

            }
        );


    // =====================================================
    // RESIZE
    // =====================================================

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


                        if (
                            nuevoAncho <= 0
                        ) {

                            return;

                        }


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
        `✅ GRÁFICA CREADA: ${estadisticas.length} hallazgos`
    );

});
