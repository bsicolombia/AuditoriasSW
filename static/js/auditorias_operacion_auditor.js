document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTOS
    // =====================================================

    const elemento = document.getElementById(
        "datos-Auditorias-Operacion-Auditor"
    );

    const canvas = document.getElementById(
        "graficaAuditoriasOperacionAuditor"
    );

    if (!elemento || !canvas) {
        return;
    }

    // =====================================================
    // LEER JSON
    // =====================================================

    let datos = [];

    try {

        const contenido = elemento.textContent.trim();

        if (!contenido) {
            return;
        }

        datos = JSON.parse(contenido);

    } catch (error) {
        return;
    }

    if (!Array.isArray(datos) || datos.length === 0) {
        return;
    }

    // =====================================================
    // CONFIGURACIÓN DE OPERACIONES
    // =====================================================

    const OPERACIONES = [

        {
            clave: "DC00",
            nombre: "Suspensión (DC00)",
            color: "#2563eb",
            hover: "#1d4ed8"
        },

        {
            clave: "RC00",
            nombre: "Reconexión (RC00)",
            color: "#f59e0b",
            hover: "#d97706"
        },

        {
            clave: "ZVCL",
            nombre: "ZVCL",
            color: "#8b5cf6",
            hover: "#7c3aed"
        }

    ];

    // =====================================================
    // PREPARAR DATOS
    // =====================================================

    function leerOperacion(item, clave) {

        const op = (item.operaciones || {})[clave] || {};

        return {
            total: Number(op.total) || 0,
            cumple: Number(op.cumple) || 0,
            no_cumple: Number(op.no_cumple) || 0
        };

    }

    const datosOrdenados = datos

        .map(function (item) {

            const operaciones = {};

            let total = 0;

            OPERACIONES.forEach(function (op) {

                operaciones[op.clave] =
                    leerOperacion(item, op.clave);

                total += operaciones[op.clave].total;

            });

            return {

                auditor:
                    String(item.auditor || "Sin auditor").trim(),

                operaciones: operaciones,

                total: total

            };

        })

        .sort(function (a, b) {
            return b.total - a.total;
        });

    const labels = datosOrdenados.map(function (item) {
        return item.auditor;
    });

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

    const altura = Math.min(
        4500,
        Math.max(450, datosOrdenados.length * 55)
    );

    canvas.style.height = `${altura}px`;
    canvas.style.minHeight = `${altura}px`;
    canvas.style.width = "100%";
    canvas.style.maxWidth = "100%";
    canvas.style.display = "block";
    canvas.style.boxSizing = "border-box";

    // =====================================================
    // MÁXIMO DEL EJE X
    // =====================================================

    const maximo = Math.max.apply(
        null,
        datosOrdenados.map(function (item) {
            return item.total;
        })
    );

    const maximoEje = maximo > 0 ? maximo * 1.15 : 10;

    // =====================================================
    // DATASETS (UNO POR OPERACIÓN)
    // =====================================================

    const datasets = OPERACIONES.map(function (op) {

        return {

            label: op.nombre,

            clave: op.clave,

            data: datosOrdenados.map(function (item) {
                return item.operaciones[op.clave].total;
            }),

            backgroundColor: op.color,

            hoverBackgroundColor: op.hover,

            borderWidth: 0,

            borderSkipped: false,

            borderRadius: 4,

            barPercentage: 0.7,

            categoryPercentage: 0.85

        };

    });

    // =====================================================
    // PLUGIN: VALORES DENTRO DE CADA SEGMENTO
    //         + TOTAL AL FINAL DE LA BARRA
    // =====================================================

    const etiquetasPlugin = {

        id: "etiquetasOperacionAuditor",

        afterDatasetsDraw: function (chart) {

            const ctx = chart.ctx;

            ctx.save();

            ctx.textBaseline = "middle";

            // ---------------------------------------------
            // VALOR DENTRO DE CADA SEGMENTO
            // ---------------------------------------------

            chart.data.datasets.forEach(function (dataset, i) {

                const meta = chart.getDatasetMeta(i);

                if (!meta || meta.hidden) {
                    return;
                }

                meta.data.forEach(function (barra, index) {

                    const valor = Number(dataset.data[index]) || 0;

                    if (valor <= 0) {
                        return;
                    }

                    const ancho = Math.abs(barra.x - barra.base);

                    // Si el segmento es muy angosto no se escribe
                    if (ancho < 22) {
                        return;
                    }

                    ctx.font = "700 11px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "center";

                    ctx.fillText(
                        valor.toLocaleString("es-CO"),
                        (barra.x + barra.base) / 2,
                        barra.y
                    );

                });

            });

            // ---------------------------------------------
            // TOTAL AL FINAL DE LA BARRA
            // ---------------------------------------------

            const metaBase = chart.getDatasetMeta(0);

            if (metaBase && metaBase.data) {

                metaBase.data.forEach(function (barra, index) {

                    const item = datosOrdenados[index];

                    if (!item || item.total <= 0) {
                        return;
                    }

                    // Solo cuenta los datasets visibles
                    let totalVisible = 0;

                    chart.data.datasets.forEach(function (ds, i) {

                        if (chart.isDatasetVisible(i)) {
                            totalVisible +=
                                Number(ds.data[index]) || 0;
                        }

                    });

                    if (totalVisible <= 0) {
                        return;
                    }

                    const x = chart.scales.x.getPixelForValue(
                        totalVisible
                    ) + 8;

                    ctx.font = "800 11px Arial";
                    ctx.fillStyle = "#0f172a";
                    ctx.textAlign = "left";

                    ctx.fillText(
                        totalVisible.toLocaleString("es-CO"),
                        x,
                        barra.y
                    );

                });

            }

            ctx.restore();

        }

    };

    // =====================================================
    // CREAR GRÁFICA
    // =====================================================

    new Chart(canvas, {

        type: "bar",

        data: {
            labels: labels,
            datasets: datasets
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
                mode: "nearest",
                axis: "y",
                intersect: true
            },

            layout: {
                padding: {
                    top: 10,
                    right: 50,
                    bottom: 20,
                    left: 10
                }
            },

            scales: {

                x: {

                    stacked: true,

                    beginAtZero: true,

                    max: maximoEje,

                    border: { display: false },

                    grid: {
                        color: "rgba(148, 163, 184, 0.16)",
                        drawTicks: false
                    },

                    ticks: {

                        precision: 0,

                        color: "#64748b",

                        padding: 8,

                        font: { size: 11, weight: "500" },

                        callback: function (value) {
                            return Number(value).toLocaleString("es-CO");
                        }

                    }

                },

                y: {

                    stacked: true,

                    afterFit: function (scale) {

                        scale.width =
                            window.innerWidth <= 600 ? 170 : 240;

                    },

                    border: { display: false },

                    grid: { display: false },

                    ticks: {

                        autoSkip: false,

                        color: "#334155",

                        padding: 10,

                        font: { size: 10, weight: "600" },

                        callback: function (value) {

                            const nombre = this.getLabelForValue(value);

                            if (!nombre) {
                                return "";
                            }

                            if (nombre.length <= 30) {
                                return nombre;
                            }

                            const posicion = nombre.lastIndexOf(" ", 30);

                            if (posicion > 0) {
                                return [
                                    nombre.substring(0, posicion),
                                    nombre.substring(posicion + 1)
                                ];
                            }

                            return [
                                nombre.substring(0, 30),
                                nombre.substring(30)
                            ];

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

                        boxWidth: 9,

                        boxHeight: 9,

                        padding: 18,

                        color: "#334155",

                        font: { size: 11, weight: "600" }

                    }

                },

                tooltip: {

                    backgroundColor: "rgba(15, 23, 42, 0.97)",

                    titleColor: "#ffffff",

                    bodyColor: "#e2e8f0",

                    borderColor: "rgba(148, 163, 184, 0.30)",

                    borderWidth: 1,

                    cornerRadius: 10,

                    padding: 12,

                    boxPadding: 5,

                    callbacks: {

                        title: function (items) {

                            if (!items.length) {
                                return "";
                            }

                            const item =
                                datosOrdenados[items[0].dataIndex];

                            return "👤 Auditor: " + item.auditor;

                        },

                        label: function (context) {

                            const item =
                                datosOrdenados[context.dataIndex];

                            const clave = context.dataset.clave;

                            const op = item.operaciones[clave];

                            return [

                                ` ${context.dataset.label}: ` +
                                op.total.toLocaleString("es-CO"),

                                `    Cumple: ` +
                                op.cumple.toLocaleString("es-CO"),

                                `    No cumple: ` +
                                op.no_cumple.toLocaleString("es-CO")

                            ];

                        },

                        afterBody: function (items) {

                            if (!items.length) {
                                return "";
                            }

                            const item =
                                datosOrdenados[items[0].dataIndex];

                            return [
                                "",
                                `TOTAL: ${item.total.toLocaleString("es-CO")}`
                            ];

                        }

                    }

                },

                datalabels: { display: false }

            }

        },

        plugins: [etiquetasPlugin]

    });

});