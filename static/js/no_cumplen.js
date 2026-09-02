document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById(
        "datos-No-Cumplen"
    );


    if (!elemento) {

        return;

    }


    // =====================================================
    // LEER DATOS
    // =====================================================

    let datos;

    try {

        datos = JSON.parse(
            elemento.textContent.trim()
        );

    } catch (error) {

        console.error(
            "❌ Error leyendo datos:",
            error
        );

        return;

    }


    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    new Chart(
        document.getElementById(
            "graficaNoCumplen"
        ),
        {

            type: "bar",


            data: {

                // =================================================
                // ORDEN:
                // 1. TOTAL
                // 2. CUMPLE
                // 3. NO CUMPLE
                // =================================================

                labels: [

                    "Total",

                    "Cumple",

                    "No cumple"

                ],


                datasets: [

                    {

                        label: "Auditorías",


                        data: [

                            Number(datos.total) || 0,

                            Number(datos.cumple) || 0,

                            Number(datos.no_cumple) || 0

                        ],


                        backgroundColor: [

                            "#1e3a8a", // Total

                            "#22c55e", // Cumple

                            "#ef4444"  // No cumple

                        ],


                        hoverBackgroundColor: [

                            "#2b458d",

                            "#16a34a",

                            "#dc2626"

                        ],


                        borderRadius: 8,

                        borderSkipped: false,

                        maxBarThickness: 55

                    }

                ]

            },


            // =====================================================
            // OPCIONES
            // =====================================================

            options: {

                responsive: true,

                maintainAspectRatio: false,


                animation: {

                    duration: 500,

                    easing: "easeOutQuart"

                },


                scales: {

                    y: {

                        beginAtZero: true,

                        grace: "8%",


                        ticks: {

                            precision: 0,

                            color: "#64748b",

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

                        },


                        grid: {

                            color:
                                "rgba(148, 163, 184, 0.18)"

                        },


                        border: {

                            display: false

                        }

                    },


                    x: {

                        grid: {

                            display: false

                        },


                        border: {

                            display: false

                        },


                        ticks: {

                            color: "#334155",

                            font: {

                                size: 12,

                                weight: "700"

                            }

                        }

                    }

                },


                // =====================================================
                // PLUGINS
                // =====================================================

                plugins: {

                    legend: {

                        display: false

                    },


                    tooltip: {

                        backgroundColor:
                            "rgba(15, 23, 42, 0.96)",

                        titleColor:
                            "#ffffff",

                        bodyColor:
                            "#e2e8f0",

                        borderColor:
                            "rgba(148, 163, 184, 0.30)",

                        borderWidth: 1,

                        cornerRadius: 9,

                        padding: 12,


                        callbacks: {

                            label:
                                function (context) {

                                    const valor =
                                        Number(
                                            context.raw
                                        ) || 0;


                                    return (
                                        " Auditorías: " +
                                        valor.toLocaleString(
                                            "es-CO"
                                        )
                                    );

                                }

                        }

                    },


                    datalabels: {

                        color: "#ffffff",


                        anchor: "center",


                        align: "center",


                        clamp: true,


                        font: {

                            weight: "bold",

                            size: 14

                        },


                        formatter:
                            function (value) {

                                if (
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


            plugins: [

                ChartDataLabels

            ]

        }
    );

});