document.addEventListener("DOMContentLoaded", function () {

    const elemento = document.getElementById(
        "datos-Auditoria_Dia"
    );

    const canvas = document.getElementById(
        "graficaAuditoriasDia"
    );

    if (!elemento) {
        console.error("❌ NO EXISTE #datos-Auditoria_Dia");
        return;
    }

    if (!canvas) {
        console.error("❌ NO EXISTE #graficaAuditoriasDia");
        return;
    }

    let datos;

    try {

        datos = JSON.parse(elemento.textContent);

    } catch (error) {

        console.error("❌ ERROR CONVIRTIENDO JSON:", error);

        return;
    }

    if (!Array.isArray(datos)) {

        console.error("❌ Los datos no son un array");

        return;
    }


    // =====================================================
    // DATOS
    // =====================================================

    const labels = datos.map(
        item => item.fecha
    );

    const cumple = datos.map(
        item => Number(item.cumple) || 0
    );

    const noCumple = datos.map(
        item => Number(item.no_cumple) || 0
    );

    const total = datos.map(
        item => Number(item.total) || 0
    );


    console.log("FECHAS:", labels);
    console.log("CUMPLE:", cumple);
    console.log("NO CUMPLE:", noCumple);
    console.log("TOTAL:", total);


    // =====================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // =====================================================

    const graficaExistente = Chart.getChart(canvas);

    if (graficaExistente) {
        graficaExistente.destroy();
    }


    // =====================================================
    // ALTURA DINÁMICA PARA SCROLL
    // =====================================================

    const alturaPorDia = 45;

    const altura = Math.max(
        500,
        labels.length * alturaPorDia
    );

    // Altura real del canvas
    canvas.style.height = altura + "px";

    // Ancho controlado por el contenedor
    canvas.style.width = "100%";
    canvas.style.maxWidth = "100%";
    canvas.style.display = "block";

    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    new Chart(canvas, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "Cumple",
                    data: cumple,
                    backgroundColor: "#22c55e",
                    borderRadius: 5,

                barPercentage: 0.65,
                categoryPercentage: 0.70,
                minBarLength: 3,
                barThickness: 14

                },

                {
                    label: "No cumple",
                    data: noCumple,
                    backgroundColor: "#ef4444",
                    borderRadius: 5,

                    barPercentage: 0.65,
                    categoryPercentage: 0.70,
                    minBarLength: 3,
                    barThickness: 14

                },

                {
                    label: "Total",
                    data: total,
                    backgroundColor: "#172554",
                    borderRadius: 5,

                    barPercentage: 0.65,
                    categoryPercentage: 0.70,
                    minBarLength: 3,
                    barThickness: 14

                }

            ]


        },


        options: {

            responsive: true,

            maintainAspectRatio: false,

            /*
             * ESTA ES LA CLAVE:
             *
             * bar normal = vertical
             *
             * indexAxis: "y" = horizontal
             */

            indexAxis: "y",


            // =================================================
            // EJES
            // =================================================

            scales: {

                x: {

                    beginAtZero: true,

                    ticks: {

                        precision: 0,

                        color: "#374151"

                    },

                    grid: {

                        color: "#e5e7eb"

                    }

                },

                y: {

                    ticks: {

                        color: "#374151",

                        font: {

                            size: 15,

                            weight: "bold"

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

                legend: {

                    position: "top",

                    labels: {

                        usePointStyle: true,

                        padding: 15,

                        font: {

                            size: 12,

                            weight: "bold"

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

                        size: 10

                    },

                    formatter: function (value) {

                        if (value === 0) {
                            return "";
                        }

                        return value.toLocaleString(
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
        "✅ GRÁFICA AUDITORÍAS POR DÍA CREADA"
    );

});
