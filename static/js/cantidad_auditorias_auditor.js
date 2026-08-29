document.addEventListener("DOMContentLoaded", function () {

    console.log("=== CANTIDAD DE AUDITORÍAS POR AUDITOR ===");


    // =====================================================
    // ELEMENTO JSON
    // =====================================================

    const elemento = document.getElementById(
        "datos-Cantidad-Auditorias-Auditor"
    );


    // =====================================================
    // CANVAS
    // =====================================================

    const canvas = document.getElementById(
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

    let datos;

    try {

        datos = JSON.parse(
            elemento.textContent.trim()
        );

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
    // VALIDAR DATOS
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


    // =====================================================
    // ORDENAR
    // =====================================================

    datos.sort(function (a, b) {

        return (
            (Number(b.total) || 0) -
            (Number(a.total) || 0)
        );

    });


    // =====================================================
    // LABELS
    // =====================================================

    const labels = datos.map(function (item) {

        return (
            item.auditor ||
            "Sin auditor"
        );

    });


    // =====================================================
    // CANTIDADES
    // =====================================================

    const cantidades = datos.map(function (item) {

        return Number(
            item.total
        ) || 0;

    });


    console.log(
        "👤 Auditores:",
        labels
    );


    console.log(
        "📊 Cantidades:",
        cantidades
    );


    // =====================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // =====================================================

    const anterior = Chart.getChart(canvas);

    if (anterior) {

        anterior.destroy();

    }


    // =====================================================
    // ALTURA DINÁMICA
    // =====================================================

    const alturaPorAuditor = 65;

    const alturaMinima = 400;

    const alturaMaxima = 3000;


    const altura = Math.min(
        alturaMaxima,
        Math.max(
            alturaMinima,
            datos.length * alturaPorAuditor
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


    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    new Chart(canvas, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [

                {

                    label: "Auditorías",

                    data: cantidades,

                    backgroundColor: "#2563eb",

                    hoverBackgroundColor: "#1d4ed8",

                    borderColor: "#2563eb",

                    borderWidth: 0,

                    borderRadius: 6,

                    borderSkipped: false,

                    barThickness: 22,

                    maxBarThickness: 22,

                    categoryPercentage: 0.72,

                    barPercentage: 0.70

                }

            ]

        },


        options: {

            responsive: true,

            maintainAspectRatio: false,

            indexAxis: "y",


            animation: {

                duration: 600,

                easing: "easeOutQuart"

            },


            interaction: {

                mode: "index",

                intersect: false

            },


            layout: {

                padding: {

                    top: 10,

                    right: 70,

                    bottom: 20,

                    left: 10

                }

            },


            scales: {

                x: {

                    beginAtZero: true,

                    grace: "10%",


                    border: {

                        display: false

                    },


                    grid: {

                        color:
                            "rgba(148, 163, 184, 0.16)",

                        drawTicks: false

                    },


                    ticks: {

                        precision: 0,

                        color: "#64748b",

                        padding: 8,


                        font: {

                            size: 11,

                            weight: "500"

                        },


                        callback: function (value) {

                            return Number(value)
                                .toLocaleString("es-CO");

                        }

                    }

                },


                y: {

                    offset: true,

                    stacked: false,


                    border: {

                        display: false

                    },


                    grid: {

                        display: false

                    },


                    ticks: {

                        color: "#334155",

                        padding: 18,

                        autoSkip: false,


                        font: {

                            size: 11,

                            weight: "600"

                        }

                    }

                }

            },


            plugins: {

                legend: {

                    display: true,

                    position: "top",

                    align: "start",


                    labels: {

                        usePointStyle: true,

                        pointStyle: "circle",

                        boxWidth: 10,

                        boxHeight: 10,

                        padding: 22,

                        color: "#334155",


                        font: {

                            size: 12,

                            weight: "600"

                        }

                    }

                },


                tooltip: {

                    backgroundColor:
                        "rgba(15, 23, 42, 0.97)",

                    titleColor: "#ffffff",

                    bodyColor: "#e2e8f0",

                    borderColor:
                        "rgba(148, 163, 184, 0.30)",

                    borderWidth: 1,

                    cornerRadius: 10,

                    padding: 13,

                    displayColors: true,

                    boxPadding: 5,


                    callbacks: {

                        title: function (items) {

                            if (!items.length) {

                                return "";

                            }

                            return (
                                "Auditor: " +
                                items[0].label
                            );

                        },


                        label: function (context) {

                            const valor =
                                Number(context.raw) || 0;

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

                    display: true,

                    color: "#ffffff",

                    anchor: "center",

                    align: "center",

                    clamp: true,

                    clip: true,


                    font: {

                        size: 11,

                        weight: "700"

                    },


                    formatter: function (value) {

                        return (
                            Number(value) || 0
                        ).toLocaleString(
                            "es-CO"
                        );

                    }

                }

            }

        },


        plugins: [

            ChartDataLabels

        ]

    });


    console.log(
        "✅ Gráfica de auditorías por auditor creada"
    );

});
