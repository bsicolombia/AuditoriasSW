document.addEventListener("DOMContentLoaded", function () {

    console.log("=== ERRORES POR TÉCNICO + HALLAZGOS ===");

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


    if (!elemento || !canvas) {

        console.error(
            "❌ No existe JSON o canvas"
        );

        return;
    }


    // =====================================================
    // JSON
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

        return;
    }


    if (!Array.isArray(datos) || datos.length === 0) {

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
    // CONTADOR
    // =====================================================

    if (contador) {

        contador.textContent =
            `${datos.length} técnicos`;

    }


    // =====================================================
    // ORDENAR TÉCNICOS
    // =====================================================

    datos.sort(function (a, b) {

        return (
            Number(b.total || 0) -
            Number(a.total || 0)
        );

    });


    // =====================================================
    // DATOS DE LA GRÁFICA
    // =====================================================

    const labels = [];

    const valores = [];

    const colores = [];

    const tipos = [];

    const informacion = [];


    datos.forEach(function (tecnico) {

        const nombre =
            String(
                tecnico.tecnico ||
                "Sin técnico"
            ).trim();


        const total =
            Number(
                tecnico.total
            ) || 0;


        // =================================================
        // TÉCNICO
        // =================================================

        labels.push(
            nombre
        );

        valores.push(
            total
        );

        colores.push(
            "#172554"
        );

        tipos.push(
            "tecnico"
        );

        informacion.push({

            tecnico:
                nombre,

            hallazgo:
                null,

            cantidad:
                total

        });


        // =================================================
        // HALLAZGOS
        // =================================================

        const hallazgos =
            Array.isArray(
                tecnico.hallazgos
            )
                ? tecnico.hallazgos
                : [];


        hallazgos.sort(function (a, b) {

            return (
                Number(b.cantidad || 0) -
                Number(a.cantidad || 0)
            );

        });


        hallazgos.forEach(function (hallazgo) {

            const nombreHallazgo =
                String(
                    hallazgo.hallazgo ||
                    "Sin hallazgo"
                ).trim();


            const cantidad =
                Number(
                    hallazgo.cantidad
                ) || 0;


            if (cantidad <= 0) {

                return;

            }


            labels.push(
                "↳ " + nombreHallazgo
            );

            valores.push(
                cantidad
            );

            colores.push(
                "#64748b"
            );

            tipos.push(
                "hallazgo"
            );

            informacion.push({

                tecnico:
                    nombre,

                hallazgo:
                    nombreHallazgo,

                cantidad:
                    cantidad

            });

        });

    });


    // =====================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // =====================================================

    const anterior =
        Chart.getChart(canvas);


    if (anterior) {

        anterior.destroy();

    }


    // =====================================================
    // ALTURA
    // =====================================================

    const alturaPorFila = 45;

    const alturaMinima = 500;

    const alturaMaxima = 6000;


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
    // PLUGIN PARA CANTIDADES
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


                        ctx.font =
                            tipos[index] === "tecnico"
                                ? "800 11px Arial"
                                : "700 10px Arial";


                        const ancho =
                            ctx.measureText(
                                texto
                            ).width;


                        const x =
                            barra.x + 9;


                        const y =
                            barra.y;


                        // -------------------------------------
                        // FONDO DEL NÚMERO
                        // -------------------------------------

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


                        // -------------------------------------
                        // BORDE
                        // -------------------------------------

                        ctx.strokeStyle =
                            tipos[index] === "tecnico"
                                ? "#bfdbfe"
                                : "#e2e8f0";

                        ctx.lineWidth =
                            1;

                        ctx.stroke();


                        // -------------------------------------
                        // NÚMERO
                        // -------------------------------------

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

    new Chart(canvas, {

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
                        8,

                    borderSkipped:
                        false,

                    barThickness:
                        20,

                    maxBarThickness:
                        20

                }

            ]

        },


        // =====================================================
        // OPCIONES
        // =====================================================

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
                        10,

                    right:
                        80,

                    bottom:
                        25,

                    left:
                        5

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
                        "15%",


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


                    afterFit:
                        function (scale) {

                            scale.width =
                                340;

                        },


                    ticks: {

                        color:
                            "#172554",

                        padding:
                            12,

                        autoSkip:
                            false,


                        font:
                            function (context) {

                                const index =
                                    context.index;


                                return {

                                    size:
                                        tipos[index] === "tecnico"
                                            ? 11
                                            : 10,

                                    weight:
                                        tipos[index] === "tecnico"
                                            ? "800"
                                            : "600"

                                };

                            },


                        callback:
                            function (value) {

                                const texto =
                                    this.getLabelForValue(
                                        value
                                    );


                                if (!texto) {

                                    return "";

                                }


                                // ---------------------------------
                                // HALLAZGO
                                // ---------------------------------

                                if (
                                    tipos[value] ===
                                    "hallazgo"
                                ) {

                                    return texto;

                                }


                                // ---------------------------------
                                // TÉCNICO
                                // ---------------------------------

                                if (
                                    texto.length > 42
                                ) {

                                    return [

                                        texto.substring(
                                            0,
                                            42
                                        ),

                                        texto.substring(
                                            42,
                                            84
                                        )

                                    ];

                                }


                                return texto;

                            }

                    }

                }

            },


            // =====================================================
            // PLUGINS
            // =====================================================

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

    });


    console.log(
        `✅ ${datos.length} técnicos cargados`
    );

});
