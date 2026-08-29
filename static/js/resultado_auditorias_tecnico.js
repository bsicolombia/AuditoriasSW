document.addEventListener("DOMContentLoaded", function () {

    console.log("=== ESTADISTICAS DE AUDITORIAS INICIADAS ===");


    // =========================================================
    // ELEMENTOS - RESULTADOS POR TÉCNICO
    // =========================================================

    const elementoDatos =
        document.getElementById(
            "datos-Resultado-Auditorias-Tecnico"
        );

    const tabla =
        document.getElementById(
            "tablaResultadoAuditoriasTecnico"
        );

    const btnVerTodos =
        document.getElementById(
            "btnVerTodosTecnicos"
        );

    const btnVerSinAuditorias =
        document.getElementById(
            "btnVerSinAuditorias"
        );

    const contadorSinAuditorias =
        document.getElementById(
            "contadorSinAuditorias"
        );


    // =========================================================
    // ELEMENTOS - RESUMEN
    // =========================================================

    const elementoTotalTecnicos =
        document.getElementById(
            "totalTecnicos"
        );

    const elementoTotalAuditados =
        document.getElementById(
            "totalTecnicosAuditados"
        );

    const elementoTotalSinAuditoria =
        document.getElementById(
            "totalTecnicosSinAuditoria"
        );

    const elementoCobertura =
        document.getElementById(
            "porcentajeCobertura"
        );


    // =========================================================
    // VALIDAR ELEMENTO JSON
    // =========================================================

    if (!elementoDatos) {

        console.error(
            "❌ NO EXISTE #datos-Resultado-Auditorias-Tecnico"
        );

        return;
    }


    // =========================================================
    // LEER JSON
    // =========================================================

    let datos = [];


    try {

        const contenido =
            elementoDatos.textContent.trim();


        if (!contenido) {

            console.error(
                "❌ #datos-Resultado-Auditorias-Tecnico ESTÁ VACÍO"
            );

            return;
        }


        datos =
            JSON.parse(contenido);


    } catch (error) {

        console.error(
            "❌ ERROR LEYENDO JSON DE TÉCNICOS:",
            error
        );

        console.error(
            "Contenido recibido:",
            elementoDatos.textContent
        );

        return;
    }


    // =========================================================
    // VALIDAR ARRAY
    // =========================================================

    if (!Array.isArray(datos)) {

        console.error(
            "❌ LOS DATOS DE TÉCNICOS NO SON UN ARRAY:",
            datos
        );

        return;
    }


    console.log(
        "✅ Técnicos recibidos:",
        datos.length
    );

    console.table(datos);


    // =========================================================
    // NORMALIZAR BOOLEANO
    // =========================================================

    /*
     * Django puede enviar:
     *
     * true
     * false
     * 1
     * 0
     * "true"
     * "false"
     * "1"
     * "0"
     *
     * Esta función permite trabajar correctamente
     * con todos esos formatos.
     */

    function tieneAuditorias(item) {

        const valor =
            item.tiene_auditorias;


        if (
            valor === true ||
            valor === 1 ||
            valor === "1" ||
            valor === "true" ||
            valor === "True" ||
            valor === "TRUE"
        ) {

            return true;

        }


        return false;

    }


    // =========================================================
    // RESUMEN
    // =========================================================

    function actualizarResumen() {

        const totalTecnicos =
            datos.length;


        const totalAuditados =
            datos.filter(function (item) {

                return tieneAuditorias(item);

            }).length;


        const totalSinAuditoria =
            datos.filter(function (item) {

                return !tieneAuditorias(item);

            }).length;


        const cobertura =
            totalTecnicos > 0
                ? (
                    totalAuditados /
                    totalTecnicos
                ) * 100
                : 0;


        // =====================================================
        // MOSTRAR DATOS
        // =====================================================

        if (elementoTotalTecnicos) {

            elementoTotalTecnicos.textContent =
                totalTecnicos.toLocaleString(
                    "es-CO"
                );

        }


        if (elementoTotalAuditados) {

            elementoTotalAuditados.textContent =
                totalAuditados.toLocaleString(
                    "es-CO"
                );

        }


        if (elementoTotalSinAuditoria) {

            elementoTotalSinAuditoria.textContent =
                totalSinAuditoria.toLocaleString(
                    "es-CO"
                );

        }


        if (elementoCobertura) {

            elementoCobertura.textContent =
                cobertura.toFixed(2) + "%";

        }


        if (contadorSinAuditorias) {

            contadorSinAuditorias.textContent =
                totalSinAuditoria.toLocaleString(
                    "es-CO"
                );

        }


        console.log(
            "========================================"
        );

        console.log(
            "TOTAL TÉCNICOS:",
            totalTecnicos
        );

        console.log(
            "TÉCNICOS AUDITADOS:",
            totalAuditados
        );

        console.log(
            "TÉCNICOS SIN AUDITORÍA:",
            totalSinAuditoria
        );

        console.log(
            "COBERTURA:",
            cobertura.toFixed(2) + "%"
        );

        console.log(
            "========================================"
        );

    }


    // =========================================================
    // ACTIVAR BOTÓN
    // =========================================================

    function activarBoton(
        botonActivo
    ) {

        if (btnVerTodos) {

            btnVerTodos.classList.remove(
                "activo"
            );

        }


        if (btnVerSinAuditorias) {

            btnVerSinAuditorias.classList.remove(
                "activo"
            );

        }


        if (botonActivo) {

            botonActivo.classList.add(
                "activo"
            );

        }

    }


    // =========================================================
    // RENDERIZAR TABLA
    // =========================================================

    function renderizarTabla(
        modo
    ) {

        if (!tabla) {

            console.warn(
                "⚠️ No existe #tablaResultadoAuditoriasTecnico"
            );

            return;
        }


        tabla.innerHTML = "";


        // =====================================================
        // COPIAR DATOS
        // =====================================================

        let datosMostrar =
            [...datos];


        // =====================================================
        // FILTRAR SIN AUDITORÍAS
        // =====================================================

        if (
            modo === "sin_auditorias"
        ) {

            datosMostrar =
                datos.filter(function (item) {

                    return !tieneAuditorias(item);

                });

        }


        // =====================================================
        // ORDENAR
        // =====================================================

        datosMostrar.sort(
            function (a, b) {

                // ------------------------------------------------
                // SUPERVISOR
                // ------------------------------------------------

                const supervisorA =
                    String(
                        a.supervisor || ""
                    );

                const supervisorB =
                    String(
                        b.supervisor || ""
                    );


                const comparacionSupervisor =
                    supervisorA.localeCompare(
                        supervisorB,
                        "es",
                        {
                            sensitivity: "base"
                        }
                    );


                if (
                    comparacionSupervisor !== 0
                ) {

                    return comparacionSupervisor;

                }


                // ------------------------------------------------
                // AUDITADOS PRIMERO
                // ------------------------------------------------

                const auditadoA =
                    tieneAuditorias(a);

                const auditadoB =
                    tieneAuditorias(b);


                if (
                    auditadoA !== auditadoB
                ) {

                    return auditadoA
                        ? -1
                        : 1;

                }


                // ------------------------------------------------
                // PORCENTAJE DE ERROR
                // ------------------------------------------------

                const errorA =
                    Number(
                        a.porcentaje_error || 0
                    );

                const errorB =
                    Number(
                        b.porcentaje_error || 0
                    );


                if (
                    errorA !== errorB
                ) {

                    return errorB - errorA;

                }


                // ------------------------------------------------
                // TÉCNICO
                // ------------------------------------------------

                return String(
                    a.tecnico || ""
                ).localeCompare(
                    String(
                        b.tecnico || ""
                    ),
                    "es",
                    {
                        sensitivity: "base"
                    }
                );

            }
        );


        // =====================================================
        // SIN DATOS
        // =====================================================

        if (
            datosMostrar.length === 0
        ) {

            const fila =
                document.createElement(
                    "tr"
                );


            fila.innerHTML = `

                <td
                    colspan="8"
                    class="sin-datos"
                >
                    No existen técnicos para
                    los filtros seleccionados.
                </td>

            `;


            tabla.appendChild(
                fila
            );

            return;
        }


        // =====================================================
        // CREAR FILAS
        // =====================================================

        datosMostrar.forEach(
            function (item) {

                const fila =
                    document.createElement(
                        "tr"
                    );


                const tecnico =
                    item.tecnico ||
                    "Sin técnico";


                const supervisor =
                    item.supervisor ||
                    "Sin supervisor";


                const cedula =
                    item.cedula ||
                    "";


                const auditado =
                    tieneAuditorias(item);


                // =================================================
                // TÉCNICO AUDITADO
                // =================================================

                if (auditado) {

                    const total =
                        Number(
                            item.total || 0
                        );


                    const porcentajeError =
                        Number(
                            item.porcentaje_error || 0
                        );


                    const noCumple =
                        Number(
                            item.no_cumple || 0
                        );


                    const cumple =
                        Number(
                            item.cumple || 0
                        );


                    const diasAuditados =
                        Number(
                            item.dias_auditados || 0
                        );


                    fila.innerHTML = `

                        <td>
                            ${escapeHtml(
                                supervisor
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                tecnico
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                cedula
                            )}
                        </td>

                        <td>
                            ${total.toLocaleString(
                                "es-CO"
                            )}
                        </td>

                        <td class="porcentaje-error">
                            ${porcentajeError.toFixed(2)}%
                        </td>

                        <td class="valor-no-cumple">
                            ${noCumple.toLocaleString(
                                "es-CO"
                            )}
                        </td>

                        <td class="valor-cumple">
                            ${cumple.toLocaleString(
                                "es-CO"
                            )}
                        </td>

                        <td>
                            ${diasAuditados.toLocaleString(
                                "es-CO"
                            )}
                        </td>

                    `;

                }


                // =================================================
                // TÉCNICO SIN AUDITORÍAS
                // =================================================

                else {

                    fila.classList.add(
                        "fila-sin-auditoria"
                    );


                    fila.innerHTML = `

                        <td>
                            ${escapeHtml(
                                supervisor
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                tecnico
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                cedula
                            )}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="btn-na"
                                title="Ver técnicos sin auditorías"
                            >
                                N/A
                            </button>

                        </td>

                        <td>
                            N/A
                        </td>

                        <td>
                            N/A
                        </td>

                        <td>
                            N/A
                        </td>

                        <td>
                            N/A
                        </td>

                    `;

                }


                tabla.appendChild(
                    fila
                );

            }
        );


        // =====================================================
        // EVENTOS DE BOTONES N/A
        // =====================================================

        tabla
            .querySelectorAll(
                ".btn-na"
            )
            .forEach(
                function (boton) {

                    boton.addEventListener(
                        "click",
                        function () {

                            renderizarTabla(
                                "sin_auditorias"
                            );

                            activarBoton(
                                btnVerSinAuditorias
                            );

                        }
                    );

                }
            );

    }


    // =========================================================
    // BOTÓN TODOS
    // =========================================================

    if (btnVerTodos) {

        btnVerTodos.addEventListener(
            "click",
            function () {

                renderizarTabla(
                    "todos"
                );

                activarBoton(
                    btnVerTodos
                );

            }
        );

    }


    // =========================================================
    // BOTÓN SIN AUDITORÍAS
    // =========================================================

    if (btnVerSinAuditorias) {

        btnVerSinAuditorias.addEventListener(
            "click",
            function () {

                renderizarTabla(
                    "sin_auditorias"
                );

                activarBoton(
                    btnVerSinAuditorias
                );

            }
        );

    }


    // =========================================================
    // INICIALIZAR RESUMEN
    // =========================================================

    actualizarResumen();


    // =========================================================
    // VISTA INICIAL
    // =========================================================

    renderizarTabla(
        "todos"
    );


    activarBoton(
        btnVerTodos
    );


    // =========================================================
    // GRÁFICA DE OPERACIONES
    // =========================================================

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


        try {

            datosOperaciones =
                JSON.parse(
                    elementoOperaciones.textContent.trim()
                );

        } catch (error) {

            console.error(
                "❌ ERROR JSON OPERACIONES:",
                error
            );

        }


        if (
            Array.isArray(
                datosOperaciones
            )
        ) {

            const operaciones =
                datosOperaciones.map(
                    function (item) {

                        return item.operacion;

                    }
                );


            const total =
                datosOperaciones.map(
                    function (item) {

                        return Number(
                            item.total
                        ) || 0;

                    }
                );


            const cumple =
                datosOperaciones.map(
                    function (item) {

                        return Number(
                            item.cumple
                        ) || 0;

                    }
                );


            const noCumple =
                datosOperaciones.map(
                    function (item) {

                        return Number(
                            item.no_cumple
                        ) || 0;

                    }
                );


            const totalCumple =
                cumple.reduce(
                    function (
                        acumulado,
                        valor
                    ) {

                        return acumulado + valor;

                    },
                    0
                );


            const totalNoCumple =
                noCumple.reduce(
                    function (
                        acumulado,
                        valor
                    ) {

                        return acumulado + valor;

                    },
                    0
                );


            const totalAuditorias =
                total.reduce(
                    function (
                        acumulado,
                        valor
                    ) {

                        return acumulado + valor;

                    },
                    0
                );


            // =====================================================
            // MOSTRAR TOTALES
            // =====================================================

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


            // =====================================================
            // DESTRUIR GRÁFICA ANTERIOR
            // =====================================================

            if (
                typeof Chart !== "undefined"
            ) {

                const graficaExistente =
                    Chart.getChart(canvas);


                if (graficaExistente) {

                    graficaExistente.destroy();

                }


                // =================================================
                // CREAR GRÁFICA
                // =================================================

                const plugins =
                    typeof ChartDataLabels !== "undefined"
                        ? [ChartDataLabels]
                        : [];


                new Chart(
                    canvas,
                    {

                        type: "bar",

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

                                            if (
                                                !value
                                            ) {

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

        }

    } else {

        console.warn(
            "⚠️ No se encontraron los elementos de la gráfica de operaciones"
        );

    }


    console.log(
        "✅ RESULTADO POR TÉCNICO CARGADO"
    );

});


// ============================================================
// SEGURIDAD HTML
// ============================================================

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text == null
            ? ""
            : String(text);


    return div.innerHTML;

}
