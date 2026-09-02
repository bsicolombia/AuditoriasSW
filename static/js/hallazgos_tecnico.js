document.addEventListener("DOMContentLoaded", function () {

    console.log("=== HALLAZGOS_TECNICO.JS INICIADO ===");


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const elemento =
        document.getElementById(
            "datos-Hallazgos-Tecnico"
        );


    const canvas =
        document.getElementById(
            "graficaHallazgosTecnico"
        );


    // =====================================================
    // VALIDAR ELEMENTOS
    // =====================================================

    if (!elemento || !canvas) {

        console.error(
            "❌ No se encontró el elemento de datos o el canvas"
        );

        return;

    }


    // =====================================================
    // LEER JSON
    // =====================================================

    let datos = [];


    try {

        const texto =
            elemento.textContent.trim();


        if (!texto) {

            console.warn(
                "⚠️ El elemento de datos está vacío"
            );

            return;

        }


        datos =
            JSON.parse(texto);


    } catch (error) {

        console.error(
            "❌ ERROR LEYENDO JSON:",
            error
        );

        return;

    }


    // =====================================================
    // VALIDAR ARRAY
    // =====================================================

    if (!Array.isArray(datos)) {

        console.error(
            "❌ Los datos no son un array"
        );

        return;

    }


    // =====================================================
    // PREPARAR DATOS
    // =====================================================

    const datosOrdenados = datos

        .map(function (item) {


            // ---------------------------------------------
            // TOTAL
            // ---------------------------------------------

            const total =
                Number(item.total) ||
                (
                    (Number(item.alto) || 0) +
                    (Number(item.medio) || 0) +
                    (Number(item.bajo) || 0) +
                    (Number(item.sin_tipo) || 0)
                );


            // ---------------------------------------------
            // NOMBRE DEL TÉCNICO
            // ---------------------------------------------

            const tecnico =
                String(
                    item.tecnico ||
                    "Sin técnico"
                ).trim();


            return {

                tecnico:
                    tecnico,

                total:
                    total

            };

        })


        // =================================================
        // ELIMINAR REGISTROS COMPLETAMENTE VACÍOS
        // =================================================

        .filter(function (item) {

            return (
                item.tecnico !== "" ||
                item.total > 0
            );

        })


        // =================================================
        // ORDENAR MAYOR → MENOR
        // =================================================

        .sort(function (a, b) {

            return (
                Number(b.total || 0) -
                Number(a.total || 0)
            );

        });


    // =====================================================
    // ARRAYS PARA CHART.JS
    // =====================================================

    const labels =
        datosOrdenados.map(function (item) {

            return item.tecnico;

        });


    const totales =
        datosOrdenados.map(function (item) {

            return Number(item.total) || 0;

        });


    console.log(
        "👷 TÉCNICOS:",
        labels
    );


    console.log(
        "🔢 TOTALES:",
        totales
    );


    // =====================================================
    // SI NO HAY DATOS
    // =====================================================

    if (datosOrdenados.length === 0) {

        console.warn(
            "⚠️ No existen datos de técnicos para mostrar."
        );

        return;

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
    // ALTURA
    // =====================================================

    const alturaPorTecnico = 45;

    const alturaMinima = 400;

    const alturaMaxima = 6000;


    const altura =
        Math.min(

            alturaMaxima,

            Math.max(

                alturaMinima,

                labels.length *
                alturaPorTecnico

            )

        );


    canvas.style.height =
        altura + "px";


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
            totales
        );


    /*
     * Espacio adicional para que el número
     * pueda quedar FUERA de la barra.
     */

    const maximoEje =
        maximo > 0

            ? maximo * 1.20

            : 10;


    // =====================================================
    // FUNCIÓN PARA DIVIDIR NOMBRES
    // =====================================================

    function dividirTexto(
        texto,
        maximoCaracteres
    ) {

        texto =
            String(
                texto || ""
            ).trim();


        if (
            texto.length <=
            maximoCaracteres
        ) {

            return texto;

        }


        const posicion =
            texto.lastIndexOf(
                " ",
                maximoCaracteres
            );


        if (
            posicion > 0
        ) {

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


        return [

            texto.substring(
                0,
                maximoCaracteres
            ),

            texto.substring(
                maximoCaracteres
            )

        ];

    }


    // =====================================================
    // PLUGIN PARA MOSTRAR EL NÚMERO
    // AFUERA DE LA BARRA
    // =====================================================

    const cantidadesPlugin = {

        id:
            "cantidadesHallazgosTecnico",


        afterDatasetsDraw:
            function (chart) {

                const ctx =
                    chart.ctx;


                const meta =
                    chart.getDatasetMeta(0);


                ctx.save();


                ctx.textBaseline =
                    "middle";


                // =================================================
                // RECORRER TODAS LAS BARRAS
                // =================================================

                totales.forEach(
                    function (
                        valor,
                        index
                    ) {


                        // ---------------------------------------------
                        // IGNORAR CEROS
                        // ---------------------------------------------

                        if (
                            valor <= 0
                        ) {

                            return;

                        }


                        // ---------------------------------------------
                        // VALIDAR BARRA
                        // ---------------------------------------------

                        if (
                            !meta.data[index]
                        ) {

                            return;

                        }


                        const barra =
                            meta.data[index];


                        // ---------------------------------------------
                        // FORMATO DEL NÚMERO
                        // ---------------------------------------------

                        const texto =
                            Number(
                                valor
                            ).toLocaleString(
                                "es-CO"
                            );


                        // ---------------------------------------------
                        // FUENTE
                        // ---------------------------------------------

                        ctx.font =
                            "800 11px Arial";


                        const anchoTexto =
                            ctx.measureText(
                                texto
                            ).width;


                        // ---------------------------------------------
                        // DIMENSIONES DEL CUADRO
                        // ---------------------------------------------

                        const paddingHorizontal =
                            6;


                        const anchoCaja =
                            anchoTexto +
                            (
                                paddingHorizontal *
                                2
                            );


                        const altoCaja =
                            20;


                        // ---------------------------------------------
                        // POSICIÓN
                        // ---------------------------------------------

                        /*
                         * barra.x es el final de la barra
                         * porque la gráfica es horizontal.
                         *
                         * Dejamos el número unos píxeles
                         * después de la barra.
                         */

                        const x =
                            barra.x + 8;


                        const y =
                            barra.y;


                        // ---------------------------------------------
                        // FONDO BLANCO
                        // ---------------------------------------------

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


                        // ---------------------------------------------
                        // BORDE
                        // ---------------------------------------------

                        ctx.strokeStyle =
                            "#000000";


                        ctx.lineWidth =
                            1;


                        ctx.stroke();


                        // ---------------------------------------------
                        // NÚMERO
                        // ---------------------------------------------

                        ctx.fillStyle =
                            "#000000";


                        ctx.fillText(

                            texto,

                            x +
                            paddingHorizontal,

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

                {

                    label:
                        "Errores",


                    data:
                        totales,


                    backgroundColor:
                        "#dc2626",


                    hoverBackgroundColor:
                        "#b91c1c",


                    borderColor:
                        "#991b1b",


                    borderWidth:
                        1,


                    borderRadius:
                        7,


                    borderSkipped:
                        false,


                    /*
                     * Barras compactas
                     */

                    barPercentage:
                        0.55,


                    categoryPercentage:
                        0.75,


                    minBarLength:
                        4

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


            // =================================================
            // ESPACIO INTERNO
            // =================================================

            layout: {

                padding: {

                    top:
                        15,

                    right:
                        70,

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
                // EJE Y
                // =============================================

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


                    // -----------------------------------------
                    // ESPACIO PARA NOMBRE DEL TÉCNICO
                    // -----------------------------------------

                    afterFit:
                        function (scale) {

                            scale.width =
                                window.innerWidth <= 600
                                    ? 190
                                    : 250;

                        },


                    ticks: {

                        color:
                            "#172554",

                        padding:
                            10,

                        autoSkip:
                            false,


                        font: {

                            size:
                                11,

                            weight:
                                "800"

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


                                return dividirTexto(

                                    nombre,

                                    window.innerWidth <= 600
                                        ? 22
                                        : 36

                                );

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
                        false

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


                                return (
                                    "👷 " +
                                    labels[index]
                                );

                            },


                        label:
                            function (context) {

                                const valor =
                                    Number(
                                        context.raw
                                    ) || 0;


                                return (
                                    " Errores: " +
                                    valor.toLocaleString(
                                        "es-CO"
                                    )
                                );

                            }

                    }

                },


                // =============================================
                // IMPORTANTE
                //
                // ChartDataLabels NO SE UTILIZA
                // porque queremos el número FUERA
                // de la barra.
                // =============================================

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
        `✅ GRÁFICA CREADA: ${datosOrdenados.length} técnicos`
    );

});
