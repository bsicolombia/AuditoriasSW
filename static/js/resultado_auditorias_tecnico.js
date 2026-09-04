document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    console.log(
        "=== ESTADISTICAS DE AUDITORIAS INICIADAS ==="
    );


    /* =========================================================
       FUNCIONES GENERALES
       ========================================================= */

    function obtenerNumero(valor) {

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return 0;
        }


        if (typeof valor === "number") {

            return Number.isFinite(valor)
                ? valor
                : 0;
        }


        let texto =
            String(valor)
                .trim()
                .replace("%", "")
                .replace(/\s/g, "");


        /*
         * Si viene como:
         *
         * 1.234,56
         *
         * convertirlo a:
         *
         * 1234.56
         */

        if (
            texto.includes(".") &&
            texto.includes(",")
        ) {

            texto =
                texto
                    .replace(/\./g, "")
                    .replace(",", ".");
        }

        /*
         * Si viene como:
         *
         * 12,5
         *
         * convertirlo a:
         *
         * 12.5
         */

        else if (
            texto.includes(",")
        ) {

            texto =
                texto.replace(",", ".");
        }


        const numero =
            Number(texto);


        return Number.isFinite(numero)
            ? numero
            : 0;
    }


    window.obtenerNumero =
        obtenerNumero;


    /* =========================================================
       SEGURIDAD HTML
       ========================================================= */

    function escapeHtml(text) {

        const div =
            document.createElement("div");


        div.textContent =
            text == null
                ? ""
                : String(text);


        return div.innerHTML;
    }


    window.escapeHtml =
        escapeHtml;


    /* =========================================================
       OBTENER DATOS DEL JSON
       ========================================================= */

    function leerDatosTecnicosDesdeDOM() {

        const elementoDatos =
            document.getElementById(
                "datos-Resultado-Auditorias-Tecnico"
            );


        if (!elementoDatos) {

            console.warn(
                "⚠️ No existe #datos-Resultado-Auditorias-Tecnico"
            );

            return [];
        }


        const contenido =
            elementoDatos.textContent.trim();


        if (!contenido) {

            console.warn(
                "⚠️ #datos-Resultado-Auditorias-Tecnico está vacío"
            );

            return [];
        }


        try {

            let datos =
                JSON.parse(
                    contenido
                );


            /*
             * Permitir diferentes estructuras
             *
             * {
             *     "data": [...]
             * }
             *
             * {
             *     "resultado": [...]
             * }
             *
             * {
             *     "datos": [...]
             * }
             */


            if (
                !Array.isArray(datos) &&
                datos &&
                Array.isArray(datos.data)
            ) {

                datos =
                    datos.data;
            }


            if (
                !Array.isArray(datos) &&
                datos &&
                Array.isArray(datos.resultado)
            ) {

                datos =
                    datos.resultado;
            }


            if (
                !Array.isArray(datos) &&
                datos &&
                Array.isArray(datos.datos)
            ) {

                datos =
                    datos.datos;
            }


            if (!Array.isArray(datos)) {

                console.error(
                    "❌ Los datos de técnicos no son un array:",
                    datos
                );

                return [];
            }


            return datos;

        } catch (error) {

            console.error(
                "❌ Error leyendo JSON de técnicos:",
                error
            );


            console.error(
                "Contenido recibido:",
                contenido
            );


            return [];
        }
    }


    /* =========================================================
       CARGAR VARIABLE GLOBAL
       ========================================================= */

    function cargarDatosTecnicosGlobales() {

        const datos =
            leerDatosTecnicosDesdeDOM();


        /*
         * Variable global.
         */

        window.Resultado_Auditorias_Tecnico =
            datos;


        console.log(
            "✅ Resultado_Auditorias_Tecnico globalizado:",
            datos.length,
            "registros"
        );


        if (datos.length > 0) {

            console.table(
                datos
            );


            console.log(
                "🔎 Primer técnico:",
                datos[0]
            );


            console.log(
                "🔎 Campos:",
                Object.keys(
                    datos[0] || {}
                )
            );
        }


        /*
         * Avisar a cualquier código que
         * necesite los datos.
         */

        try {

            window.dispatchEvent(
                new CustomEvent(
                    "ResultadoAuditoriasTecnicoActualizado",
                    {
                        detail: datos
                    }
                )
            );

        } catch (error) {

            console.warn(
                "⚠️ No se pudo emitir evento global:",
                error
            );
        }


        /*
         * Actualizar tabla si existe.
         */

        if (
            typeof window.actualizarResultadoTecnicos ===
            "function"
        ) {

            window.actualizarResultadoTecnicos();
        }


        /*
         * Actualizar resumen global.
         */

        actualizarResumenVisual();


        return datos;
    }


    window.cargarDatosTecnicosGlobales =
        cargarDatosTecnicosGlobales;


    /* =========================================================
       RESUMEN GLOBAL DE TÉCNICOS
       ========================================================= */

    window.obtenerResumenTecnicosGlobal =
        function () {

            const datos =
                Array.isArray(
                    window.Resultado_Auditorias_Tecnico
                )
                    ? window.Resultado_Auditorias_Tecnico
                    : [];


            /*
             * Determinar si un técnico tiene auditorías.
             */

            function tieneAuditorias(item) {

                if (!item) {
                    return false;
                }


                /*
                 * Primero revisar los campos booleanos
                 * que puedan venir desde Django.
                 */

                const valor =
                    item.tiene_auditorias ??
                    item.tieneAuditorias;


                if (
                    valor === true ||
                    valor === 1 ||
                    valor === "1" ||
                    valor === "true" ||
                    valor === "True" ||
                    valor === "TRUE" ||
                    valor === "SI" ||
                    valor === "Si" ||
                    valor === "Sí" ||
                    valor === "sí"
                ) {

                    return true;
                }


                /*
                 * Si no existe un indicador booleano,
                 * revisar la cantidad de auditorías.
                 */

                const totalAuditorias =
                    obtenerNumero(
                        item.total ??
                        item.total_auditorias ??
                        item.numero_auditorias ??
                        item.auditorias ??
                        0
                    );


                return totalAuditorias > 0;
            }


            /*
             * Total de técnicos contratados.
             */

            const totalTecnicos =
                datos.length;


            /*
             * Técnicos que tienen auditorías.
             */

            const tecnicosAuditados =
                datos.filter(
                    tieneAuditorias
                ).length;


            /*
             * Técnicos que NO tienen auditorías.
             */

            const tecnicosSinAuditoria =
                totalTecnicos -
                tecnicosAuditados;


            /*
             * Porcentaje de técnicos auditados.
             */

            const porcentajeAuditados =
                totalTecnicos > 0
                    ? (
                        tecnicosAuditados /
                        totalTecnicos
                    ) * 100
                    : 0;


            /*
             * Porcentaje de técnicos sin auditar.
             */

            const porcentajeSinAuditar =
                totalTecnicos > 0
                    ? (
                        tecnicosSinAuditoria /
                        totalTecnicos
                    ) * 100
                    : 0;


            return {

                totalTecnicos:
                    totalTecnicos,

                totalAuditados:
                    tecnicosAuditados,

                totalSinAuditoria:
                    tecnicosSinAuditoria,

                porcentajeAuditados:
                    porcentajeAuditados,

                porcentajeSinAuditar:
                    porcentajeSinAuditar

            };
        };


    /* =========================================================
       ACTUALIZAR RESUMEN VISUAL
       ========================================================= */

    function actualizarResumenVisual() {

        const resumen =
            window.obtenerResumenTecnicosGlobal();


        /*
         * IMPORTANTE:
         *
         * Estos ID corresponden exactamente
         * a los ID de estadisticas.html
         */


        const elementoTotal =
            document.getElementById(
                "contadorTotalTecnicosGlobal"
            );


        const elementoAuditados =
            document.getElementById(
                "contadorTecnicosAuditadosGlobal"
            );


        const elementoPorcentajeAuditados =
            document.getElementById(
                "contadorPorcentajeAuditadosGlobal"
            );


        const elementoSinAuditoria =
            document.getElementById(
                "contadorTecnicosSinAuditoriaGlobal"
            );


        const elementoPorcentajeSinAuditar =
            document.getElementById(
                "contadorPorcentajeSinAuditarGlobal"
            );


        /* =====================================================
           TÉCNICOS CONTRATADOS
           ===================================================== */

        if (elementoTotal) {

            elementoTotal.textContent =
                resumen.totalTecnicos.toLocaleString(
                    "es-CO"
                );
        }


        /* =====================================================
           TÉCNICOS AUDITADOS
           ===================================================== */

        if (elementoAuditados) {

            elementoAuditados.textContent =
                resumen.totalAuditados.toLocaleString(
                    "es-CO"
                );
        }


        /* =====================================================
           % AUDITADOS
           ===================================================== */

        if (elementoPorcentajeAuditados) {

            elementoPorcentajeAuditados.textContent =
                resumen.porcentajeAuditados
                    .toFixed(2)
                    .replace(/\.00$/, "") +
                "%";
        }


        /* =====================================================
           TÉCNICOS SIN AUDITORÍA
           ===================================================== */

        if (elementoSinAuditoria) {

            elementoSinAuditoria.textContent =
                resumen.totalSinAuditoria.toLocaleString(
                    "es-CO"
                );
        }


        /* =====================================================
           % SIN AUDITAR
           ===================================================== */

        if (elementoPorcentajeSinAuditar) {

            elementoPorcentajeSinAuditar.textContent =
                resumen.porcentajeSinAuditar
                    .toFixed(2)
                    .replace(/\.00$/, "") +
                "%";
        }


        console.log(
            "📊 RESUMEN GLOBAL:",
            resumen
        );


        return resumen;
    }


    window.actualizarResumenTecnicosGlobal =
        actualizarResumenVisual;


    /* =========================================================
       CARGAR TÉCNICOS
       ========================================================= */

    cargarDatosTecnicosGlobales();


    /*
     * Actualizar nuevamente por seguridad.
     */

    actualizarResumenVisual();


    /* =========================================================
       GRÁFICA DE OPERACIONES
       ========================================================= */

    const elementoOperaciones =
        document.getElementById(
            "datos-operaciones"
        );


    const canvas =
        document.getElementById(
            "graficaOperaciones"
        );


    if (
        elementoOperaciones &&
        canvas
    ) {

        let datosOperaciones = [];


        /* -----------------------------------------------------
           LEER JSON
           ----------------------------------------------------- */

        try {

            const contenidoOperaciones =
                elementoOperaciones.textContent.trim();


            if (contenidoOperaciones) {

                datosOperaciones =
                    JSON.parse(
                        contenidoOperaciones
                    );
            }

        } catch (error) {

            console.error(
                "❌ ERROR JSON OPERACIONES:",
                error
            );


            console.error(
                "Contenido operaciones:",
                elementoOperaciones.textContent
            );
        }


        /* -----------------------------------------------------
           VALIDAR
           ----------------------------------------------------- */

        if (
            Array.isArray(
                datosOperaciones
            )
        ) {

            console.log(
                "✅ Operaciones recibidas:",
                datosOperaciones.length
            );


            console.table(
                datosOperaciones
            );


            /* =================================================
               DATOS
               ================================================= */

            const operaciones =
                datosOperaciones.map(
                    function (item) {

                        return (
                            item.operacion ||
                            item.nombre_operacion ||
                            "Sin operación"
                        );
                    }
                );


            const total =
                datosOperaciones.map(
                    function (item) {

                        return obtenerNumero(

                            item.total ??
                            item.total_auditorias ??
                            0

                        );
                    }
                );


            const cumple =
                datosOperaciones.map(
                    function (item) {

                        return obtenerNumero(
                            item.cumple
                        );
                    }
                );


            const noCumple =
                datosOperaciones.map(
                    function (item) {

                        return obtenerNumero(
                            item.no_cumple
                        );
                    }
                );


            /* =================================================
               TOTALES
               ================================================= */

            const totalCumple =
                cumple.reduce(
                    function (
                        acumulado,
                        valor
                    ) {

                        return (
                            acumulado +
                            valor
                        );

                    },
                    0
                );


            const totalNoCumple =
                noCumple.reduce(
                    function (
                        acumulado,
                        valor
                    ) {

                        return (
                            acumulado +
                            valor
                        );

                    },
                    0
                );


            const totalAuditorias =
                total.reduce(
                    function (
                        acumulado,
                        valor
                    ) {

                        return (
                            acumulado +
                            valor
                        );

                    },
                    0
                );


            /* =================================================
               TOTALES VISUALES
               ================================================= */

            const elementoCumple =
                document.getElementById(
                    "totalCumple"
                );


            const elementoNoCumple =
                document.getElementById(
                    "totalNoCumple"
                );


            const elementoTotal =
                document.getElementById(
                    "totalAuditorias"
                );


            if (elementoCumple) {

                elementoCumple.textContent =
                    totalCumple.toLocaleString(
                        "es-CO"
                    );
            }


            if (elementoNoCumple) {

                elementoNoCumple.textContent =
                    totalNoCumple.toLocaleString(
                        "es-CO"
                    );
            }


            if (elementoTotal) {

                elementoTotal.textContent =
                    totalAuditorias.toLocaleString(
                        "es-CO"
                    );
            }


            /* =================================================
               CHART.JS
               ================================================= */

            if (
                typeof Chart !==
                "undefined"
            ) {

                const graficaExistente =
                    Chart.getChart(
                        canvas
                    );


                if (graficaExistente) {

                    graficaExistente.destroy();
                }


                const plugins =
                    typeof ChartDataLabels !==
                    "undefined"

                        ? [ChartDataLabels]

                        : [];


                new Chart(
                    canvas,
                    {

                        type:
                            "bar",


                        data: {

                            labels:
                                operaciones,


                            datasets: [

                                {

                                    label:
                                        "Total",

                                    data:
                                        total,

                                    backgroundColor:
                                        "#172554",

                                    hoverBackgroundColor:
                                        "#1e3a8a",

                                    borderRadius:
                                        6,

                                    borderSkipped:
                                        false,

                                    minBarLength:
                                        8

                                },


                                {

                                    label:
                                        "Cumple",

                                    data:
                                        cumple,

                                    backgroundColor:
                                        "#22c55e",

                                    hoverBackgroundColor:
                                        "#16a34a",

                                    borderRadius:
                                        6,

                                    borderSkipped:
                                        false,

                                    minBarLength:
                                        8

                                },


                                {

                                    label:
                                        "No cumple",

                                    data:
                                        noCumple,

                                    backgroundColor:
                                        "#ef4444",

                                    hoverBackgroundColor:
                                        "#dc2626",

                                    borderRadius:
                                        6,

                                    borderSkipped:
                                        false,

                                    minBarLength:
                                        8

                                }

                            ]
                        },


                        options: {

                            responsive:
                                true,

                            maintainAspectRatio:
                                false,


                            scales: {

                                y: {

                                    beginAtZero:
                                        true,

                                    ticks: {

                                        precision:
                                            0,

                                        color:
                                            "#374151",

                                        font: {

                                            size:
                                                11
                                        }
                                    },

                                    grid: {

                                        color:
                                            "rgba(148, 163, 184, 0.18)"
                                    },

                                    border: {

                                        display:
                                            false
                                    }
                                },


                                x: {

                                    ticks: {

                                        color:
                                            "#374151",

                                        font: {

                                            weight:
                                                "bold",

                                            size:
                                                12
                                        }
                                    },

                                    grid: {

                                        display:
                                            false
                                    },

                                    border: {

                                        display:
                                            false
                                    }
                                }
                            },


                            plugins: {

                                legend: {

                                    position:
                                        "top",

                                    align:
                                        "start",

                                    labels: {

                                        usePointStyle:
                                            true,

                                        pointStyle:
                                            "circle",

                                        padding:
                                            18,

                                        font: {

                                            size:
                                                12,

                                            weight:
                                                "bold"
                                        },


                                        generateLabels:
                                            function () {

                                                return [

                                                    {

                                                        text:
                                                            `Total (${totalAuditorias.toLocaleString("es-CO")})`,

                                                        fillStyle:
                                                            "#172554",

                                                        strokeStyle:
                                                            "#172554",

                                                        pointStyle:
                                                            "circle",

                                                        datasetIndex:
                                                            0

                                                    },


                                                    {

                                                        text:
                                                            `Cumple (${totalCumple.toLocaleString("es-CO")})`,

                                                        fillStyle:
                                                            "#22c55e",

                                                        strokeStyle:
                                                            "#22c55e",

                                                        pointStyle:
                                                            "circle",

                                                        datasetIndex:
                                                            1

                                                    },


                                                    {

                                                        text:
                                                            `No cumple (${totalNoCumple.toLocaleString("es-CO")})`,

                                                        fillStyle:
                                                            "#ef4444",

                                                        strokeStyle:
                                                            "#ef4444",

                                                        pointStyle:
                                                            "circle",

                                                        datasetIndex:
                                                            2

                                                    }

                                                ];
                                            }
                                    }
                                },


                                datalabels: {

                                    color:
                                        "#ffffff",

                                    anchor:
                                        "center",

                                    align:
                                        "center",

                                    clamp:
                                        true,

                                    font: {

                                        weight:
                                            "bold",

                                        size:
                                            11
                                    },


                                    formatter:
                                        function (
                                            value
                                        ) {

                                            const numero =
                                                obtenerNumero(
                                                    value
                                                );


                                            if (
                                                numero === 0
                                            ) {

                                                return "";
                                            }


                                            return numero.toLocaleString(
                                                "es-CO"
                                            );
                                        }
                                }
                            }
                        },


                        plugins:
                            plugins

                    }
                );


                console.log(
                    "✅ GRÁFICA DE OPERACIONES CREADA"
                );

            } else {

                console.warn(
                    "⚠️ Chart.js no está cargado"
                );
            }

        } else {

            console.warn(
                "⚠️ Los datos de operaciones no son un array"
            );
        }

    } else {

        console.warn(
            "⚠️ No se encontraron los elementos de la gráfica de operaciones"
        );
    }


    /* =========================================================
       ESCUCHAR ACTUALIZACIONES GLOBALES
       ========================================================= */

    window.addEventListener(
        "ResultadoAuditoriasTecnicoActualizado",
        function () {

            console.log(
                "🔄 Actualización global de técnicos recibida"
            );


            actualizarResumenVisual();


            if (
                typeof window.actualizarResultadoTecnicos ===
                "function"
            ) {

                window.actualizarResultadoTecnicos();
            }

        }
    );


    /* =========================================================
       FINAL
       ========================================================= */

    console.log(
        "✅ RESULTADO POR TÉCNICO CARGADO"
    );


    console.log(
        "🌎 Variable global disponible como:",
        "window.Resultado_Auditorias_Tecnico"
    );

});