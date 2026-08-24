document.addEventListener("DOMContentLoaded", function () {

    console.log("=== OPERACIONES.JS INICIADO ===");

    const elemento = document.getElementById("datos-operaciones");
    const canvas = document.getElementById("graficaOperaciones");

    if (!elemento) {
        console.error("❌ NO EXISTE #datos-operaciones");
        return;
    }

    if (!canvas) {
        console.error("❌ NO EXISTE #graficaOperaciones");
        return;
    }

    let datos;

    try {
        datos = JSON.parse(elemento.textContent);
    } catch (error) {
        console.error("❌ ERROR JSON:", error);
        return;
    }

    if (!Array.isArray(datos)) {
        console.error("❌ datos_operaciones NO ES ARRAY");
        return;
    }

    console.log("DATOS OPERACIONES:", datos);


    // =====================================================
    // DATOS POR OPERACIÓN
    // =====================================================

    const operaciones = datos.map(
        item => item.operacion
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


    // =====================================================
    // TOTALES GENERALES
    // =====================================================

    const totalCumple = cumple.reduce(
        (acumulado, valor) => acumulado + valor,
        0
    );

    const totalNoCumple = noCumple.reduce(
        (acumulado, valor) => acumulado + valor,
        0
    );

    const totalAuditorias = total.reduce(
        (acumulado, valor) => acumulado + valor,
        0
    );


    console.log("================================");
    console.log("TOTAL CUMPLE:", totalCumple);
    console.log("TOTAL NO CUMPLE:", totalNoCumple);
    console.log("TOTAL AUDITORÍAS:", totalAuditorias);
    console.log("================================");


    // =====================================================
    // MOSTRAR TOTALES EN LOS CÍRCULOS
    // =====================================================

    const elementoCumple = document.getElementById(
        "totalCumple"
    );

    const elementoNoCumple = document.getElementById(
        "totalNoCumple"
    );

    const elementoTotal = document.getElementById(
        "totalAuditorias"
    );


    if (elementoCumple) {

        elementoCumple.textContent =
            totalCumple.toLocaleString("es-CO");

    }


    if (elementoNoCumple) {

        elementoNoCumple.textContent =
            totalNoCumple.toLocaleString("es-CO");

    }


    if (elementoTotal) {

        elementoTotal.textContent =
            totalAuditorias.toLocaleString("es-CO");

    }


    // =====================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // =====================================================

    const graficaExistente = Chart.getChart(canvas);

    if (graficaExistente) {
        graficaExistente.destroy();
    }


    // =====================================================
    // GRÁFICA POR OPERACIÓN
    // =====================================================

    new Chart(canvas, {

        type: "bar",

        data: {

            labels: operaciones,

            datasets: [

                {
                    label: "Cumple",

                    data: cumple,

                    backgroundColor: "#22c55e",

                    borderRadius: 6,

                    minBarLength: 8
                },

                {
                    label: "No cumple",

                    data: noCumple,

                    backgroundColor: "#ef4444",

                    borderRadius: 6,

                    minBarLength: 8
                },

                {
                    label: "Total",

                    data: total,

                    backgroundColor: "#172554",

                    borderRadius: 6,

                    minBarLength: 8
                }

            ]

        },


        options: {

            responsive: true,

            maintainAspectRatio: false,


            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {

                        precision: 0,

                        color: "#374151",

                        font: {
                            size: 11
                        }

                    },

                    grid: {
                        color: "#e5e7eb"
                    }

                },

                x: {

                    ticks: {

                        color: "#374151",

                        font: {
                            weight: "bold",
                            size: 12
                        }

                    },

                    grid: {
                        display: false
                    }

                }

            },


            plugins: {

                legend: {

                    position: "top",

                    labels: {

                        usePointStyle: true,

                        padding: 15,

                        font: {
                            size: 12,
                            weight: "bold"
                        },

                        generateLabels: function (chart) {

                            return [

                                {
                                    text: `Cumple (${totalCumple.toLocaleString("es-CO")})`,
                                    fillStyle: "#22c55e",
                                    strokeStyle: "#22c55e",
                                    pointStyle: "circle",
                                    datasetIndex: 0
                                },

                                {
                                    text: `No cumple (${totalNoCumple.toLocaleString("es-CO")})`,
                                    fillStyle: "#ef4444",
                                    strokeStyle: "#ef4444",
                                    pointStyle: "circle",
                                    datasetIndex: 1
                                },

                                {
                                    text: `Total (${totalAuditorias.toLocaleString("es-CO")})`,
                                    fillStyle: "#172554",
                                    strokeStyle: "#172554",
                                    pointStyle: "circle",
                                    datasetIndex: 2
                                }

                            ];

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

                        size: 11

                    },

                    formatter: function (value) {

                        if (!value) {
                            return "";
                        }

                        return value.toLocaleString("es-CO");

                    }

                }

            }

        },


        plugins: [
            ChartDataLabels
        ]

    });


    console.log("✅ GRÁFICA CREADA");

});
