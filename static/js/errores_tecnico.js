document.addEventListener("DOMContentLoaded", function () {

    console.log("=== ERRORES_POR_TECNICOS.JS INICIADO ===");


    // =====================================================
    // OBTENER ELEMENTOS
    // =====================================================

    const elemento = document.getElementById(
        "datos-Errores-Por-Tecnicos"
    );

    const canvas = document.getElementById(
        "graficaErroresTecnico"
    );


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
            "❌ Error al leer JSON:",
            error
        );

        return;
    }


    if (!Array.isArray(datos)) {

        console.error(
            "❌ Los datos no son un array"
        );

        return;
    }


    // =====================================================
    // TIPOS DE HALLAZGO
    // =====================================================

    const tipos = [
        "alto",
        "medio",
        "bajo",
        "sin_tipo"
    ];


    const colores = {

        alto: "#dc2626",

        medio: "#f97316",

        bajo: "#eab308",

        sin_tipo: "#64748b"

    };


    const nombresTipos = {

        alto: "Alto",

        medio: "Medio",

        bajo: "Bajo",

        sin_tipo: "Sin tipo"

    };


    // =====================================================
    // OBTENER TÉCNICOS
    // =====================================================

    const tecnicos = [
        ...new Set(
            datos.map(function (item) {

                return item.tecnico || "Sin técnico";

            })
        )
    ];


    // =====================================================
    // TOTAL POR TÉCNICO
    // =====================================================

    const totalesTecnicos = tecnicos.map(
        function (tecnico) {

            const total = datos

                .filter(function (item) {

                    return (
                        (item.tecnico || "Sin técnico")
                        === tecnico
                    );

                })

                .reduce(function (suma, item) {

                    return suma +
                        (Number(item.cantidad) || 0);

                }, 0);


            return {

                tecnico: tecnico,

                total: total

            };

        }
    );


    // =====================================================
    // ORDENAR MAYOR → MENOR
    // =====================================================

    totalesTecnicos.sort(
        function (a, b) {

            return b.total - a.total;

        }
    );


    const tecnicosOrdenados =
        totalesTecnicos.map(
            function (item) {

                return item.tecnico;

            }
        );


    // =====================================================
    // DATASETS
    // =====================================================

    const datasets = tipos.map(
        function (tipo) {

            return {

                label: nombresTipos[tipo],

                data: tecnicosOrdenados.map(
                    function (tecnico) {

                        const encontrado =
                            datos.find(
                                function (item) {

                                    return (

                                        (item.tecnico ||
                                            "Sin técnico")
                                        === tecnico

                                        &&

                                        item.tipo_hallazgo
                                        === tipo

                                    );

                                }
                            );


                        return encontrado
                            ? Number(
                                encontrado.cantidad
                            ) || 0
                            : 0;

                    }
                ),

                backgroundColor:
                    colores[tipo],

                borderColor:
                    "#ffffff",

                borderWidth: 1,

                borderRadius: 5,

                borderSkipped: false,

                barPercentage: 0.72,

                categoryPercentage: 0.72

            };

        }
    );


    // =====================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // =====================================================

    const graficaExistente =
        Chart.getChart(canvas);

    if (graficaExistente) {

        graficaExistente.destroy();

    }


    // =====================================================
    // ALTURA DINÁMICA
    // =====================================================

    /*
     * Altura visual de cada técnico.
     *
     * Si hay pocos técnicos:
     * mínimo 500px.
     *
     * Si hay muchos:
     * el canvas crece y aparece
     * scroll en el contenedor.
     */

    const alturaPorTecnico = 48;

    const alturaMinima = 500;

    const altura = Math.max(
        alturaMinima,
        tecnicosOrdenados.length *
        alturaPorTecnico
    );


    canvas.style.height =
        altura + "px";

    canvas.style.width = "100%";

    canvas.style.maxWidth = "100%";

    canvas.style.display = "block";


    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    new Chart(
        canvas,
        {

            type: "bar",


            // =================================================
            // DATOS
            // =================================================

            data: {

                labels: tecnicosOrdenados,

                datasets: datasets

            },


            // =================================================
            // OPCIONES
            // =================================================

            options: {

                responsive: true,

                maintainAspectRatio: false,

                indexAxis: "y",


                // =================================================
                // ANIMACIÓN
                // =================================================

                animation: {

                    duration: 700,

                    easing: "easeOutQuart"

                },


                // =================================================
                // EJES
                // =================================================

                scales: {

                    x: {

                        stacked: true,

                        beginAtZero: true,

                        border: {

                            display: false

                        },

                        grid: {

                            color: "#e2e8f0",

                            drawBorder: false

                        },

                        ticks: {

                            color: "#64748b",

                            precision: 0,

                            padding: 6,

                            font: {

                                size: 11

                            }

                        }

                    },


                    y: {

                        stacked: true,

                        border: {

                            display: false

                        },

                        afterFit:
                            function (scale) {

                                scale.width = 185;

                            },


                        grid: {

                            display: false

                        },


                        ticks: {

                            color: "#334155",

                            padding: 10,

                            font: {

                                size: 11,

                                weight: "600"

                            },


                            callback:
                                function (value) {

                                    const nombre =
                                        this.getLabelForValue(
                                            value
                                        );


                                    if (
                                        nombre.length > 25
                                    ) {

                                        return (
                                            nombre.substring(
                                                0,
                                                25
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

                        display: true,

                        position: "top",

                        align: "start",

                        labels: {

                            usePointStyle: true,

                            pointStyle: "rectRounded",

                            boxWidth: 10,

                            boxHeight: 10,

                            padding: 18,

                            color: "#334155",

                            font: {

                                size: 11,

                                weight: "600"

                            }

                        }

                    },


                    // =============================================
                    // TOOLTIP
                    // =============================================

                    tooltip: {

                        backgroundColor:
                            "rgba(15, 23, 42, 0.96)",

                        titleColor: "#ffffff",

                        bodyColor: "#e2e8f0",

                        borderColor: "#475569",

                        borderWidth: 1,

                        padding: 12,

                        cornerRadius: 8,

                        displayColors: true,


                        callbacks: {

                            label:
                                function (context) {

                                    const valor =
                                        Number(
                                            context.raw
                                        ) || 0;


                                    return (
                                        " " +
                                        context.dataset.label +
                                        ": " +
                                        valor.toLocaleString(
                                            "es-CO"
                                        )
                                    );

                                }

                        }

                    },


                    // =============================================
                    // DATOS SOBRE LAS BARRAS
                    // =============================================

                    datalabels: {

                        color: "#ffffff",

                        font: {

                            size: 10,

                            weight: "bold"

                        },

                        anchor: "center",

                        align: "center",

                        clamp: true,

                        formatter:
                            function (value) {

                                if (
                                    !value ||
                                    Number(value) === 0
                                ) {

                                    return "";

                                }


                                return Number(value)
                                    .toLocaleString(
                                        "es-CO"
                                    );

                            }

                    }

                }

            },


            // =====================================================
            // PLUGIN
            // =====================================================

            plugins: [

                ChartDataLabels

            ]

        }
    );


    console.log(
        "✅ GRÁFICA HORIZONTAL CREADA CORRECTAMENTE"
    );

});
