document.addEventListener("DOMContentLoaded", function () {

    console.log("=== HALLAZGOS_TECNICO.JS INICIADO ===");

    const elemento = document.getElementById(
        "datos-Hallazgos-Tecnico"
    );

    const canvas = document.getElementById(
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

    let datos;

    try {

        datos = JSON.parse(
            elemento.textContent
        );

    } catch (error) {

        console.error(
            "❌ ERROR JSON:",
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
    // PREPARAR Y ORDENAR DATOS
    // MAYOR → MENOR
    // =====================================================

    const datosOrdenados = datos

        .map(function (item) {

            const total =
                Number(item.total) ||
                (
                    (Number(item.alto) || 0) +
                    (Number(item.medio) || 0) +
                    (Number(item.bajo) || 0) +
                    (Number(item.sin_tipo) || 0)
                );

            return {

                tecnico:
                    item.tecnico ||
                    "Sin técnico",

                total: total

            };

        })

        .sort(function (a, b) {

            return b.total - a.total;

        });


    // =====================================================
    // ARRAYS PARA CHART.JS
    // =====================================================

    const labels = datosOrdenados.map(function (item) {

        return item.tecnico;

    });


    const totales = datosOrdenados.map(function (item) {

        return item.total;

    });


    console.log(
        "TÉCNICOS:",
        labels
    );

    console.log(
        "TOTALES:",
        totales
    );


    // =====================================================
    // SI NO HAY DATOS
    // =====================================================

    if (labels.length === 0) {

        console.warn(
            "⚠️ No existen datos para mostrar"
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
    // ALTURA Y ANCHO DE LA GRÁFICA
    // =====================================================

    /*
    * Altura por técnico.
    *
    * 32px hace la gráfica más compacta.
    */

    const alturaPorTecnico = 32;


    /*
    * Altura mínima de la gráfica.
    *
    * Se mantiene en 400px para evitar
    * que quede demasiado pequeña.
    */

    const altura = Math.max(
        400,
        labels.length * alturaPorTecnico
    );


    /*
    * Aplicar altura al canvas.
    */

    canvas.style.height =
        altura + "px";


    /*
    * =====================================================
    * ANCHO
    * =====================================================
    *
    * El canvas ocupa únicamente el ancho
    * disponible de su contenedor.
    *
    * No se utiliza un ancho fijo como 900px.
    */

    canvas.style.width = "100%";

    canvas.style.maxWidth = "100%";

    canvas.style.display = "block";

    canvas.style.boxSizing = "border-box";



    // =====================================================
    // CALCULAR MÁXIMO DEL EJE X
    // =====================================================

    const maximo =
        Math.max.apply(
            null,
            totales
        );


    /*
     * Agregamos un 15% de espacio al final.
     *
     * Ejemplo:
     *
     * Mayor valor = 100
     *
     * Máximo del eje = 115
     *
     * Entonces la barra llega hasta
     * aproximadamente el 87% del ancho.
     */

    const maximoEje =

        maximo > 0

            ? maximo * 1.15

            : 10;


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

                {

                    label: "Errores",

                    data: totales,

                    backgroundColor: "#dc2626",

                    borderColor: "#991b1b",

                    borderWidth: 1,

                    borderRadius: 5,


                    /*
                     * BARRAS MÁS DELGADAS
                     */

                    barPercentage: 0.45,

                    categoryPercentage: 0.70,

                    minBarLength: 4

                }

            ]

        },


        // =================================================
        // OPCIONES
        // =================================================

        options: {

            responsive: true,

            maintainAspectRatio: false,


            /*
             * Barras horizontales
             */

            indexAxis: "y",


            // =================================================
            // EJES
            // =================================================

            scales: {

                // =============================================
                // EJE X
                // =============================================

                x: {

                    beginAtZero: true,

                    /*
                     * Deja espacio después de la barra
                     */

                    max: maximoEje,


                    ticks: {

                        precision: 0,

                        color: "#374151",

                        font: {

                            size: 11

                        },


                        callback: function (value) {

                            return Number(value)
                                .toLocaleString("es-CO");

                        }

                    },


                    grid: {

                        color: "#e5e7eb"

                    }

                },


                // =============================================
                // EJE Y
                // =============================================

                y: {

                    /*
                     * Espacio para los nombres
                     */

                    afterFit: function (scale) {

                        scale.width = 170;

                    },


                    ticks: {

                        color: "#374151",

                        font: {

                            size: 11,

                            weight: "bold"

                        },

                        padding: 8,


                        /*
                         * Evitar nombres demasiado largos
                         */

                        callback: function (value) {

                            const nombre =
                                this.getLabelForValue(
                                    value
                                );


                            if (
                                nombre.length > 24
                            ) {

                                return (
                                    nombre.substring(
                                        0,
                                        24
                                    ) +
                                    "..."
                                );

                            }


                            return nombre;

                        }

                    },


                    grid: {

                        display: false

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

                    display: false

                },


                // =============================================
                // TOOLTIP
                // =============================================

                tooltip: {

                    callbacks: {

                        title: function (items) {

                            if (
                                !items.length
                            ) {

                                return "";

                            }


                            return labels[
                                items[0].dataIndex
                            ];

                        },


                        label: function (context) {

                            return (

                                " Errores: " +

                                Number(
                                    context.raw
                                ).toLocaleString(
                                    "es-CO"
                                )

                            );

                        }

                    }

                },


                // =============================================
                // VALORES SOBRE LAS BARRAS
                // =============================================

                datalabels: {

                    color: "#ffffff",

                    anchor: "center",

                    align: "center",

                    clamp: true,


                    font: {

                        weight: "bold",

                        size: 11

                    },


                    formatter: function (value) {

                        if (!value) {

                            return "";

                        }


                        return Number(
                            value
                        ).toLocaleString(
                            "es-CO"
                        );

                    }

                }

            }

        },


        // =====================================================
        // PLUGIN CHARTDATALABELS
        // =====================================================

        plugins: [

            ChartDataLabels

        ]

    });


    console.log(
        "✅ GRÁFICA CREADA CORRECTAMENTE"
    );

});
