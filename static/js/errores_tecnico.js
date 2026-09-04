document.addEventListener("DOMContentLoaded", function () {

    console.log("=== ERRORES POR TÉCNICO + HALLAZGOS ===");


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const elemento =
        document.getElementById(
            "datos-Errores-Detallados-Tecnico"
        );

    const canvas =
        document.getElementById(
            "graficaErroresTecnico"
        );

    const contador =
        document.getElementById(
            "totalTecnicosErrores"
        );


    // =====================================================
    // VALIDAR ELEMENTOS
    // =====================================================

    if (!elemento || !canvas) {

        console.error(
            "❌ No existe JSON o canvas"
        );

        return;

    }


    // =====================================================
    // LEER JSON
    // =====================================================

    let datos = [];

    try {

        datos =
            JSON.parse(
                elemento.textContent.trim()
            );

    } catch (error) {

        console.error(
            "❌ Error leyendo JSON:",
            error
        );

        return;

    }


    if (
        !Array.isArray(datos) ||
        datos.length === 0
    ) {

        console.warn(
            "⚠️ No existen datos"
        );

        if (contador) {

            contador.textContent =
                "0 técnicos";

        }

        return;

    }


    // =====================================================
    // FUNCIÓN:
    // OBTENER CANTIDAD DE UN HALLAZGO
    // =====================================================

    function obtenerCantidadHallazgo(hallazgo) {

        const cantidad =
            Number(
                hallazgo &&
                hallazgo.cantidad
            );


        return Number.isFinite(cantidad)
            ? cantidad
            : 0;

    }


    // =====================================================
    // FUNCIÓN:
    // CALCULAR TOTAL REAL DEL TÉCNICO
    //
    // IMPORTANTE:
    // NO usamos tecnico.total.
    //
    // El total se calcula sumando todos los hallazgos.
    // =====================================================

    function obtenerTotalTecnico(tecnico) {

        if (
            !tecnico ||
            !Array.isArray(tecnico.hallazgos)
        ) {

            return 0;

        }


        return tecnico.hallazgos.reduce(
            function (total, hallazgo) {

                return (
                    total +
                    obtenerCantidadHallazgo(
                        hallazgo
                    )
                );

            },
            0
        );

    }


    // =====================================================
    // PREPARAR DATOS
    //
    // Creamos una copia para no modificar el JSON original.
    // =====================================================

    const tecnicos =
        datos.map(
            function (tecnico, indice) {

                const hallazgos =
                    Array.isArray(
                        tecnico.hallazgos
                    )
                        ? tecnico.hallazgos
                            .map(
                                function (hallazgo) {

                                    return {

                                        hallazgo:
                                            String(
                                                hallazgo.hallazgo ||
                                                "Sin hallazgo"
                                            ).trim(),

                                        cantidad:
                                            obtenerCantidadHallazgo(
                                                hallazgo
                                            )

                                    };

                                }
                            )
                            .filter(
                                function (hallazgo) {

                                    return (
                                        hallazgo.cantidad > 0
                                    );

                                }
                            )
                            .sort(
                                function (a, b) {

                                    return (
                                        b.cantidad -
                                        a.cantidad
                                    );

                                }
                            )
                        : [];


                return {

                    tecnico:
                        String(
                            tecnico.tecnico ||
                            "Sin técnico"
                        ).trim(),

                    hallazgos:
                        hallazgos,

                    total:
                        hallazgos.reduce(
                            function (total, hallazgo) {

                                return (
                                    total +
                                    hallazgo.cantidad
                                );

                            },
                            0
                        ),

                    indiceOriginal:
                        indice

                };

            }
        );


    // =====================================================
    // ORDENAR TÉCNICOS
    //
    // MAYOR → MENOR
    //
    // En caso de empate:
    // conservar orden original.
    // =====================================================

    tecnicos.sort(
        function (a, b) {

            if (
                a.total !== b.total
            ) {

                return (
                    b.total -
                    a.total
                );

            }


            return (
                a.indiceOriginal -
                b.indiceOriginal
            );

        }
    );


    // =====================================================
    // CONTADOR
    // =====================================================

    if (contador) {

        contador.textContent =
            `${tecnicos.length} técnicos`;

    }


    // =====================================================
    // ARRAYS PARA CHART.JS
    // =====================================================

    const labels = [];

    const valores = [];

    const colores = [];

    const tipos = [];

    const informacion = [];


    // =====================================================
    // CONSTRUIR DATOS DE LA GRÁFICA
    // =====================================================

    tecnicos.forEach(
        function (tecnico) {

            // =================================================
            // TÉCNICO
            // =================================================

            labels.push(
                tecnico.tecnico
            );

            valores.push(
                tecnico.total
            );

            colores.push(
                "#dc2626"
            );

            tipos.push(
                "tecnico"
            );

            informacion.push({

                tecnico:
                    tecnico.tecnico,

                hallazgo:
                    null,

                cantidad:
                    tecnico.total

            });


            // =================================================
            // HALLAZGOS
            // =================================================

            tecnico.hallazgos.forEach(
                function (hallazgo) {

                    labels.push(
                        "↳ " +
                        hallazgo.hallazgo
                    );

                    valores.push(
                        hallazgo.cantidad
                    );

                    colores.push(
                        "#64748b"
                    );

                    tipos.push(
                        "hallazgo"
                    );

                    informacion.push({

                        tecnico:
                            tecnico.tecnico,

                        hallazgo:
                            hallazgo.hallazgo,

                        cantidad:
                            hallazgo.cantidad

                    });

                }
            );

        }
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
    // ALTURA DE LA GRÁFICA
    // =====================================================

    const alturaPorFila =
        52;

    const alturaMinima =
        500;

    const alturaMaxima =
        6000;


    const altura =
        Math.min(
            alturaMaxima,
            Math.max(
                alturaMinima,
                labels.length *
                alturaPorFila
            )
        );


    canvas.style.height =
        `${altura}px`;

    canvas.style.width =
        "100%";

    canvas.style.display =
        "block";


    // =====================================================
    // FUNCIÓN PARA DIVIDIR TEXTO
    // =====================================================

    function dividirTexto(
        texto,
        maximo
    ) {

        texto =
            String(
                texto || ""
            ).trim();


        if (
            texto.length <= maximo
        ) {

            return texto;

        }


        const limite =
            Math.min(
                maximo,
                texto.length
            );


        let posicion =
            texto.lastIndexOf(
                " ",
                limite
            );


        if (
            posicion < 10
        ) {

            posicion =
                texto.indexOf(
                    " ",
                    limite
                );

        }


        if (
            posicion === -1
        ) {

            return [

                texto.substring(
                    0,
                    maximo
                ),

                texto.substring(
                    maximo
                )

            ];

        }


        return [

            texto.substring(
                0,
                posicion
            ).trim(),

            texto.substring(
                posicion + 1
            ).trim()

        ];

    }


    // =====================================================
    // PLUGIN PARA MOSTRAR CANTIDADES
    // =====================================================

    const cantidadesPlugin = {

        id:
            "cantidadesErroresTecnico",


        afterDatasetsDraw:
            function (chart) {

                const ctx =
                    chart.ctx;

                const meta =
                    chart.getDatasetMeta(0);


                ctx.save();


                ctx.textBaseline =
                    "middle";


                valores.forEach(
                    function (valor, index) {

                        if (
                            valor <= 0 ||
                            !meta.data[index]
                        ) {

                            return;

                        }


                        const barra =
                            meta.data[index];


                        const texto =
                            Number(
                                valor
                            ).toLocaleString(
                                "es-CO"
                            );


                        // ---------------------------------
                        // FUENTE
                        // ---------------------------------

                        ctx.font =
                            tipos[index] === "tecnico"
                                ? "800 11px Arial"
                                : "700 10px Arial";


                        const ancho =
                            ctx.measureText(
                                texto
                            ).width;


                        // ---------------------------------
                        // POSICIÓN
                        // ---------------------------------

                        const x =
                            barra.x + 8;

                        const y =
                            barra.y;


                        // ---------------------------------
                        // FONDO
                        // ---------------------------------

                        ctx.fillStyle =
                            "#ffffff";


                        ctx.beginPath();


                        ctx.roundRect(
                            x,
                            y - 10,
                            ancho + 12,
                            20,
                            5
                        );


                        ctx.fill();


                        // ---------------------------------
                        // BORDE
                        // ---------------------------------

                        ctx.strokeStyle =
                            tipos[index] === "tecnico"
                                ? "#bfdbfe"
                                : "#e2e8f0";


                        ctx.lineWidth =
                            1;


                        ctx.stroke();


                        // ---------------------------------
                        // NÚMERO
                        // ---------------------------------

                        ctx.fillStyle =
                            tipos[index] === "tecnico"
                                ? "#172554"
                                : "#334155";


                        ctx.fillText(
                            texto,
                            x + 6,
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
                            "Cantidad",

                        data:
                            valores,

                        backgroundColor:
                            colores,

                        hoverBackgroundColor:
                            colores,

                        borderRadius:
                            7,

                        borderSkipped:
                            false,

                        barThickness:
                            22,

                        maxBarThickness:
                            22

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

                indexAxis:
                    "y",


                animation: {

                    duration:
                        700,

                    easing:
                        "easeOutQuart"

                },


                interaction: {

                    mode:
                        "nearest",

                    axis:
                        "y",

                    intersect:
                        false

                },


                layout: {

                    padding: {

                        top:
                            15,

                        right:
                            90,

                        bottom:
                            25,

                        left:
                            10

                    }

                },


                // =================================================
                // EJES
                // =================================================

                scales: {

                    x: {

                        beginAtZero:
                            true,

                        grace:
                            "18%",


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


                        // =================================================
                        // ANCHO NOMBRES
                        // =================================================

                        afterFit:
                            function (scale) {

                                scale.width =
                                    window.innerWidth <= 600
                                        ? 190
                                        : 300;

                            },


                        ticks: {

                            color:
                                "#172554",

                            padding:
                                10,

                            autoSkip:
                                false,


                            font:
                                function (context) {

                                    const index =
                                        context.index;


                                    return {

                                        size:
                                            tipos[index] ===
                                            "tecnico"
                                                ? 11
                                                : 10,

                                        weight:
                                            tipos[index] ===
                                            "tecnico"
                                                ? "800"
                                                : "600"

                                    };

                                },


                            // =================================================
                            // TEXTO
                            // =================================================

                            callback:
                                function (value) {

                                    const texto =
                                        this.getLabelForValue(
                                            value
                                        );


                                    if (!texto) {

                                        return "";

                                    }


                                    // -----------------------------------------
                                    // HALLAZGO
                                    // -----------------------------------------

                                    if (
                                        tipos[value] ===
                                        "hallazgo"
                                    ) {

                                        return texto;

                                    }


                                    // -----------------------------------------
                                    // TÉCNICO
                                    // -----------------------------------------

                                    return dividirTexto(
                                        texto,
                                        window.innerWidth <= 600
                                            ? 24
                                            : 38
                                    );

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
                            false

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

                            // -----------------------------------------
                            // TÍTULO
                            // -----------------------------------------

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


                                    const info =
                                        informacion[
                                            index
                                        ];


                                    if (
                                        tipos[index] ===
                                        "tecnico"
                                    ) {

                                        return (
                                            "👷 " +
                                            info.tecnico
                                        );

                                    }


                                    return (
                                        "🔎 " +
                                        info.hallazgo
                                    );

                                },


                            // -----------------------------------------
                            // CANTIDAD
                            // -----------------------------------------

                            label:
                                function (context) {

                                    const valor =
                                        Number(
                                            context.raw
                                        ) || 0;


                                    return (
                                        ` Cantidad: ` +
                                        valor.toLocaleString(
                                            "es-CO"
                                        )
                                    );

                                },


                            // -----------------------------------------
                            // INFORMACIÓN EXTRA
                            // -----------------------------------------

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


                                    const info =
                                        informacion[
                                            index
                                        ];


                                    if (
                                        tipos[index] ===
                                        "hallazgo"
                                    ) {

                                        return [

                                            "",

                                            "Técnico:",

                                            info.tecnico

                                        ];

                                    }


                                    return "";

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


            plugins: [

                cantidadesPlugin

            ]

        }
    );


    // =====================================================
    // LOG FINAL
    // =====================================================

    console.log(
        `✅ ${tecnicos.length} técnicos cargados`
    );


    console.log(
        "📊 Totales calculados desde los hallazgos:",
        tecnicos.map(
            function (tecnico) {

                return {

                    tecnico:
                        tecnico.tecnico,

                    total:
                        tecnico.total

                };

            }
        )
    );

});
