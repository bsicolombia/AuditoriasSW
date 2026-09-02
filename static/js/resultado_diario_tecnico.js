document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    console.log(
        "=== RESULTADO DIARIO POR TÉCNICO - HISTÓRICO ==="
    );


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const datosElemento =
        document.getElementById(
            "datos-Resultado-Diario-Tecnico"
        );

    const tabla =
        document.getElementById(
            "tablaResultadoDiarioTecnico"
        );

    const head =
        document.getElementById(
            "tablaResultadoDiarioTecnicoHead"
        );

    const body =
        document.getElementById(
            "tablaResultadoDiarioTecnicoBody"
        );

    const foot =
        document.getElementById(
            "tablaResultadoDiarioTecnicoFoot"
        );


    if (
        !datosElemento ||
        !tabla ||
        !head ||
        !body ||
        !foot
    ) {

        console.error(
            "❌ No se encontraron los elementos de la tabla diaria."
        );

        return;

    }


    // =====================================================
    // LEER JSON
    // =====================================================

    let datos = {};

    try {

        const contenido =
            datosElemento.textContent.trim();

        if (!contenido) {

            throw new Error(
                "El elemento de datos está vacío."
            );

        }

        datos =
            JSON.parse(contenido);

    }
    catch (error) {

        console.error(
            "❌ Error leyendo Resultado_Diario_Tecnico:",
            error
        );

        body.innerHTML = `
            <tr>
                <td
                    colspan="100"
                    class="tabla-sin-datos"
                >
                    Error cargando los datos.
                </td>
            </tr>
        `;

        return;

    }


    // =====================================================
    // ORDENAR FECHAS
    // =====================================================

    /*
     * IMPORTANTE:
     *
     * Las fechas quedan:
     *
     * 30/08
     * 29/08
     * 28/08
     * ...
     * 01/08
     *
     * Es decir:
     * MÁS RECIENTE → MÁS ANTIGUA
     */

    const dias =
        Array.isArray(datos.dias)
            ? [...datos.dias].sort(function (a, b) {

                return compararFechas(b, a);

            })
            : [];


    // =====================================================
    // TÉCNICOS
    // =====================================================

    const tecnicosOriginales =
        Array.isArray(datos.tecnicos)
            ? [...datos.tecnicos]
            : [];


    let tecnicos =
        [...tecnicosOriginales];


    // =====================================================
    // ESTADO DEL ORDEN
    // =====================================================

    /*
     * null = orden original
     *
     * desc = mayor → menor
     *
     * asc = menor → mayor
     */

    let ordenActual = {

        columna: null,

        direccion: null

    };


    // =====================================================
    // LIMPIAR TABLA
    // =====================================================

    head.innerHTML = "";

    body.innerHTML = "";

    foot.innerHTML = "";


    console.log(
        "📅 Días:",
        dias
    );

    console.log(
        "👷 Técnicos:",
        tecnicos.length
    );


    // =====================================================
    // SIN TÉCNICOS
    // =====================================================

    if (!tecnicos.length) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="${Math.max(dias.length + 5, 1)}"
                    class="tabla-sin-datos"
                >
                    No hay técnicos para mostrar.
                </td>
            </tr>
        `;

        return;

    }


    // =====================================================
    // RENDERIZAR
    // =====================================================

    renderizarTabla();


    // =====================================================
    // RENDERIZAR TABLA
    // =====================================================

    function renderizarTabla() {

        head.innerHTML = "";

        body.innerHTML = "";

        foot.innerHTML = "";


        // =================================================
        // CALCULAR TOTALES
        // =================================================

        let totalGeneral = 0;

        let erroresGenerales = 0;


        const resumenDias =
            {};


        dias.forEach(function (dia) {

            resumenDias[dia] = {

                auditados: 0,

                errores: 0

            };

        });


        tecnicos.forEach(function (tecnico) {

            const analisis =
                analizarHistoricoTecnico(
                    tecnico,
                    dias
                );


            totalGeneral +=
                analisis.diasAuditados;


            erroresGenerales +=
                analisis.totalErrores;


            dias.forEach(function (dia) {

                const valor =
                    obtenerValorDia(
                        tecnico,
                        dia
                    );


                if (
                    valor.tipo === "ok"
                ) {

                    resumenDias[dia].auditados++;

                }
                else if (
                    valor.tipo === "error"
                ) {

                    resumenDias[dia].auditados++;

                    resumenDias[dia].errores +=
                        valor.numero;

                }

            });

        });


        // =================================================
        // ENCABEZADO
        // =================================================

        const encabezado =
            document.createElement("tr");


        let encabezadoHtml = `

            <th class="columna-tecnico">
                Técnico
            </th>

        `;


        // =================================================
        // FECHAS
        // =================================================

        dias.forEach(function (dia, indice) {

            const estadoOrden =
                obtenerEstadoOrden(indice);


            let iconoOrden =
                "↕";


            if (
                estadoOrden === "asc"
            ) {

                iconoOrden =
                    "↑";

            }
            else if (
                estadoOrden === "desc"
            ) {

                iconoOrden =
                    "↓";

            }


            encabezadoHtml += `

                <th
                    class="dia-header"
                    data-columna-dia="${indice}"
                >

                    <button
                        type="button"
                        class="boton-orden-dia"
                        data-orden-dia="${indice}"
                        title="Ordenar por ${escapeHtml(dia)}"
                    >

                        <span class="dia-texto">

                            ${formatearDia(dia)}

                        </span>

                        <span
                            class="icono-orden"
                        >

                            ${iconoOrden}

                        </span>

                    </button>

                </th>

            `;

        });


        // =================================================
        // COLUMNAS FINALES
        // =================================================

        encabezadoHtml += `

            <th class="columna-total">
                Días total
            </th>

            <th class="columna-errores">
                Errores
            </th>

            <th class="columna-estado">
                Estado
            </th>

            <th class="columna-accion">
                Acción
            </th>

        `;


        encabezado.innerHTML =
            encabezadoHtml;


        head.appendChild(
            encabezado
        );


        // =================================================
        // FILA TOTAL GENERAL SUPERIOR
        // =================================================

        const filaTotal =
            document.createElement("tr");


        let totalHtml = `

            <td class="nombre-total">
                TOTAL GENERAL
            </td>

        `;


        // =================================================
        // TOTAL POR CADA DÍA
        // =================================================

        dias.forEach(function (dia) {

            const resumen =
                resumenDias[dia];


            // ---------------------------------------------
            // SIN AUDITORÍAS
            // ---------------------------------------------

            if (
                resumen.auditados === 0
            ) {

                totalHtml += `

                    <td
                        class="celda-na total-dia"
                        title="Sin auditorías"
                    >
                        N/A
                    </td>

                `;

                return;

            }


            // ---------------------------------------------
            // SIN ERRORES
            // ---------------------------------------------

            if (
                resumen.errores === 0
            ) {

                totalHtml += `

                    <td
                        class="celda-ok total-dia"
                        title="${resumen.auditados} auditorías"
                    >
                        OK
                    </td>

                `;

                return;

            }


            // ---------------------------------------------
            // CON ERRORES
            // ---------------------------------------------

            totalHtml += `

                <td
                    class="celda-error total-dia"
                    title="${resumen.auditados} auditorías"
                >

                    ${formatearNumero(
                        resumen.errores
                    )}

                </td>

            `;

        });


        // =================================================
        // TOTAL DÍAS
        // =================================================

        totalHtml += `

            <td
                class="celda-total-general"
            >

                ${formatearNumero(
                    totalGeneral
                )}

            </td>

        `;


        // =================================================
        // TOTAL ERRORES
        // =================================================

        totalHtml += `

            <td
                class="${
                    erroresGenerales > 0
                        ? "celda-error"
                        : "celda-total-general"
                }"
            >

                ${formatearNumero(
                    erroresGenerales
                )}

            </td>

        `;


        // =================================================
        // ESTADO GENERAL
        // =================================================

        let estadoGeneral =
            "Todo bien";


        let claseEstadoGeneral =
            "estado-todo-bien";


        if (
            erroresGenerales > 0
        ) {

            estadoGeneral =
                "Revisar";

            claseEstadoGeneral =
                "estado-mejora";

        }


        if (
            totalGeneral === 0
        ) {

            estadoGeneral =
                "Sin auditorías";

            claseEstadoGeneral =
                "estado-sin-auditorias";

        }


        totalHtml += `

            <td class="resumen-superior">

                <span
                    class="estado-badge ${claseEstadoGeneral}"
                >

                    ${estadoGeneral}

                </span>

            </td>

        `;


        // =================================================
        // ACCIÓN GENERAL
        // =================================================

        totalHtml += `

            <td class="resumen-superior">

                <span
                    class="accion-badge ${
                        erroresGenerales > 0
                            ? "accion-reauditar"
                            : "accion-ok"
                    }"
                >

                    ${
                        erroresGenerales > 0
                            ? "Revisar"
                            : "OK"
                    }

                </span>

            </td>

        `;


        filaTotal.innerHTML =
            totalHtml;


        /*
         * IMPORTANTE:
         *
         * El TOTAL GENERAL se agrega al THEAD,
         * no al TFOOT.
         *
         * Por eso queda arriba de los técnicos.
         */

        head.appendChild(
            filaTotal
        );


        // =================================================
        // EVENTOS DE ORDEN
        // =================================================

        const botonesOrden =
            head.querySelectorAll(
                ".boton-orden-dia"
            );


        botonesOrden.forEach(
            function (boton) {

                boton.addEventListener(
                    "click",
                    function () {

                        const indice =
                            Number(
                                boton.dataset.ordenDia
                            );


                        ordenarPorDia(
                            indice
                        );

                    }
                );

            }
        );


        // =================================================
        // FILAS DE TÉCNICOS
        // =================================================

        tecnicos.forEach(function (tecnico) {

            const fila =
                document.createElement("tr");


            const analisis =
                analizarHistoricoTecnico(
                    tecnico,
                    dias
                );


            // =================================================
            // NOMBRE
            // =================================================

            let html = `

                <td class="nombre-tecnico">

                    ${escapeHtml(
                        tecnico.tecnico ||
                        "Sin nombre"
                    )}

                </td>

            `;


            // =================================================
            // DÍAS
            // =================================================

            dias.forEach(function (dia) {

                const valor =
                    obtenerValorDia(
                        tecnico,
                        dia
                    );


                // ---------------------------------------------
                // N/A
                // ---------------------------------------------

                if (
                    valor.tipo === "na"
                ) {

                    html += `

                        <td
                            class="celda-na"
                            data-valor-orden="-1"
                        >

                            N/A

                        </td>

                    `;

                    return;

                }


                // ---------------------------------------------
                // OK
                // ---------------------------------------------

                if (
                    valor.tipo === "ok"
                ) {

                    html += `

                        <td
                            class="celda-ok"
                            data-valor-orden="0"
                        >

                            OK

                        </td>

                    `;

                    return;

                }


                // ---------------------------------------------
                // ERROR
                // ---------------------------------------------

                if (
                    valor.tipo === "error"
                ) {

                    html += `

                        <td
                            class="celda-error"
                            data-valor-orden="${valor.numero}"
                        >

                            ${formatearNumero(
                                valor.numero
                            )}

                        </td>

                    `;

                    return;

                }


                // ---------------------------------------------
                // SEGURIDAD
                // ---------------------------------------------

                html += `

                    <td
                        class="celda-na"
                        data-valor-orden="-1"
                    >

                        N/A

                    </td>

                `;

            });


            // =================================================
            // DÍAS TOTAL
            // =================================================

            const total =
                analisis.diasAuditados;


            // =================================================
            // ERRORES
            // =================================================

            const errores =
                analisis.totalErrores;


            html += `

                <td class="celda-total">

                    ${formatearNumero(
                        total
                    )}

                </td>


                <td class="${
                    errores > 0
                        ? "celda-error"
                        : "celda-ok"
                }">

                    ${formatearNumero(
                        errores
                    )}

                </td>

            `;


            // =================================================
            // ESTADO
            // =================================================

            let claseEstado =
                "estado-todo-bien";


            if (
                analisis.estado === "Mejora"
            ) {

                claseEstado =
                    "estado-mejora";

            }
            else if (
                analisis.estado === "Crítico"
            ) {

                claseEstado =
                    "estado-critico";

            }
            else if (
                analisis.estado === "Sin auditorías"
            ) {

                claseEstado =
                    "estado-sin-auditorias";

            }


            html += `

                <td>

                    <span
                        class="estado-badge ${claseEstado}"
                    >

                        ${escapeHtml(
                            analisis.estado
                        )}

                    </span>

                </td>

            `;


            // =================================================
            // ACCIÓN
            // =================================================

            let claseAccion =
                "accion-ok";


            if (
                analisis.accion ===
                "Volver a auditar"
            ) {

                claseAccion =
                    "accion-reauditar";

            }
            else if (
                analisis.accion ===
                "Mantener seguimiento"
            ) {

                claseAccion =
                    "accion-seguimiento";

            }


            html += `

                <td>

                    <span
                        class="accion-badge ${claseAccion}"
                    >

                        ${escapeHtml(
                            analisis.accion
                        )}

                    </span>

                </td>

            `;


            fila.innerHTML =
                html;


            body.appendChild(
                fila
            );

        });


        // =================================================
        // FOOTER
        // =================================================

        /*
         * Lo dejamos vacío.
         *
         * El TOTAL GENERAL ahora está arriba.
         */

        foot.innerHTML = "";

    }


    // =====================================================
    // ORDENAR POR DÍA
    // =====================================================

    function ordenarPorDia(indiceDia) {

        /*
         * NUEVO DÍA:
         *
         * Primer clic:
         *
         * MAYOR → MENOR
         */

        if (
            ordenActual.columna !== indiceDia
        ) {

            ordenActual.columna =
                indiceDia;

            ordenActual.direccion =
                "desc";

        }


        /*
         * Segundo clic:
         *
         * MENOR → MAYOR
         */

        else if (
            ordenActual.direccion === "desc"
        ) {

            ordenActual.direccion =
                "asc";

        }


        /*
         * Tercer clic:
         *
         * ORDEN ORIGINAL
         */

        else {

            ordenActual.columna =
                null;

            ordenActual.direccion =
                null;

        }


        // =================================================
        // ORDEN ORIGINAL
        // =================================================

        if (
            ordenActual.columna === null
        ) {

            tecnicos =
                [...tecnicosOriginales];

            renderizarTabla();

            return;

        }


        // =================================================
        // FECHA SELECCIONADA
        // =================================================

        const diaSeleccionado =
            dias[indiceDia];


        // =================================================
        // ORDENAR TÉCNICOS
        // =================================================

        tecnicos.sort(
            function (a, b) {

                const valorA =
                    obtenerValorOrden(
                        a,
                        diaSeleccionado
                    );


                const valorB =
                    obtenerValorOrden(
                        b,
                        diaSeleccionado
                    );


                // -----------------------------------------
                // N/A ABAJO
                // -----------------------------------------

                if (
                    valorA.na &&
                    !valorB.na
                ) {

                    return 1;

                }


                if (
                    !valorA.na &&
                    valorB.na
                ) {

                    return -1;

                }


                // -----------------------------------------
                // AMBOS N/A
                // -----------------------------------------

                if (
                    valorA.na &&
                    valorB.na
                ) {

                    return 0;

                }


                // -----------------------------------------
                // MENOR → MAYOR
                // -----------------------------------------

                if (
                    ordenActual.direccion === "asc"
                ) {

                    return (
                        valorA.numero -
                        valorB.numero
                    );

                }


                // -----------------------------------------
                // MAYOR → MENOR
                // -----------------------------------------

                return (
                    valorB.numero -
                    valorA.numero
                );

            }
        );


        // =================================================
        // REDIBUJAR
        // =================================================

        renderizarTabla();

    }


    // =====================================================
    // OBTENER VALOR PARA ORDENAR
    // =====================================================

    function obtenerValorOrden(
        tecnico,
        dia
    ) {

        const valor =
            obtenerValorDia(
                tecnico,
                dia
            );


        if (
            valor.tipo === "na"
        ) {

            return {

                numero: 0,

                na: true

            };

        }


        if (
            valor.tipo === "ok"
        ) {

            return {

                numero: 0,

                na: false

            };

        }


        if (
            valor.tipo === "error"
        ) {

            return {

                numero:
                    Number(
                        valor.numero
                    ) || 0,

                na: false

            };

        }


        return {

            numero: 0,

            na: true

        };

    }


    // =====================================================
    // ESTADO DEL ORDEN
    // =====================================================

    function obtenerEstadoOrden(indiceDia) {

        if (
            ordenActual.columna !== indiceDia
        ) {

            return null;

        }


        return ordenActual.direccion;

    }


    // =====================================================
    // ANALIZAR HISTÓRICO
    // =====================================================

    function analizarHistoricoTecnico(
        tecnico,
        dias
    ) {

        const historico = [];


        dias.forEach(function (dia) {

            const valor =
                obtenerValorDia(
                    tecnico,
                    dia
                );


            if (
                valor.tipo === "na"
            ) {

                return;

            }


            if (
                valor.tipo === "ok"
            ) {

                historico.push({

                    dia: dia,

                    errores: 0,

                    auditado: true

                });

                return;

            }


            if (
                valor.tipo === "error"
            ) {

                historico.push({

                    dia: dia,

                    errores:
                        valor.numero,

                    auditado: true

                });

            }

        });


        // =================================================
        // SIN AUDITORÍAS
        // =================================================

        if (
            historico.length === 0
        ) {

            return {

                estado:
                    "Sin auditorías",

                accion:
                    "Auditar",

                diasAuditados:
                    0,

                diasConErrores:
                    0,

                totalErrores:
                    0,

                porcentajeDiasConErrores:
                    0,

                tendencia:
                    "sin-datos"

            };

        }


        // =================================================
        // DÍAS AUDITADOS
        // =================================================

        const diasAuditados =
            historico.length;


        // =================================================
        // DÍAS CON ERRORES
        // =================================================

        const diasConErrores =
            historico.filter(
                function (item) {

                    return (
                        item.errores > 0
                    );

                }
            ).length;


        // =================================================
        // TOTAL ERRORES
        // =================================================

        const totalErrores =
            historico.reduce(
                function (
                    acumulado,
                    item
                ) {

                    return (
                        acumulado +
                        item.errores
                    );

                },
                0
            );


        // =================================================
        // PORCENTAJE
        // =================================================

        const porcentajeDiasConErrores =
            (
                diasConErrores /
                diasAuditados
            ) * 100;


        // =================================================
        // ÚLTIMAS AUDITORÍAS
        // =================================================

        const ultimas =
            historico.slice(-3);


        const ultimasSinErrores =
            ultimas.length >= 2 &&
            ultimas.every(
                function (item) {

                    return (
                        item.errores === 0
                    );

                }
            );


        // =================================================
        // HISTÓRICO ANTERIOR
        // =================================================

        const anteriores =
            historico.slice(
                0,
                Math.max(
                    historico.length - 3,
                    0
                )
            );


        // =================================================
        // PROMEDIO ANTERIOR
        // =================================================

        const erroresAnteriores =
            anteriores.reduce(
                function (
                    acumulado,
                    item
                ) {

                    return (
                        acumulado +
                        item.errores
                    );

                },
                0
            );


        const promedioAnterior =
            anteriores.length > 0
                ? (
                    erroresAnteriores /
                    anteriores.length
                )
                : 0;


        // =================================================
        // PROMEDIO RECIENTE
        // =================================================

        const erroresRecientes =
            ultimas.reduce(
                function (
                    acumulado,
                    item
                ) {

                    return (
                        acumulado +
                        item.errores
                    );

                },
                0
            );


        const promedioReciente =
            ultimas.length > 0
                ? (
                    erroresRecientes /
                    ultimas.length
                )
                : 0;


        // =================================================
        // DETECTAR MEJORA
        // =================================================

        let estaMejorando =
            false;


        if (
            anteriores.length >= 2 &&
            promedioAnterior > 0 &&
            promedioReciente <
                promedioAnterior
        ) {

            estaMejorando =
                true;

        }


        if (
            ultimasSinErrores &&
            diasConErrores > 0
        ) {

            estaMejorando =
                true;

        }


        // =================================================
        // CRÍTICO
        // =================================================

        if (
            porcentajeDiasConErrores >= 70
        ) {

            if (
                estaMejorando &&
                ultimasSinErrores
            ) {

                return {

                    estado:
                        "Mejora",

                    accion:
                        "Mantener seguimiento",

                    diasAuditados:
                        diasAuditados,

                    diasConErrores:
                        diasConErrores,

                    totalErrores:
                        totalErrores,

                    porcentajeDiasConErrores:
                        porcentajeDiasConErrores,

                    tendencia:
                        "mejorando"

                };

            }


            return {

                estado:
                    "Crítico",

                accion:
                    "Volver a auditar",

                diasAuditados:
                    diasAuditados,

                diasConErrores:
                    diasConErrores,

                totalErrores:
                    totalErrores,

                porcentajeDiasConErrores:
                    porcentajeDiasConErrores,

                tendencia:
                    "critica"

            };

        }


        // =================================================
        // MEJORA
        // =================================================

        if (
            estaMejorando
        ) {

            return {

                estado:
                    "Mejora",

                accion:
                    "Mantener seguimiento",

                diasAuditados:
                    diasAuditados,

                diasConErrores:
                    diasConErrores,

                totalErrores:
                    totalErrores,

                porcentajeDiasConErrores:
                    porcentajeDiasConErrores,

                tendencia:
                    "mejorando"

            };

        }


        // =================================================
        // TODO BIEN
        // =================================================

        if (
            totalErrores === 0
        ) {

            return {

                estado:
                    "Todo bien",

                accion:
                    "Auditar",

                diasAuditados:
                    diasAuditados,

                diasConErrores:
                    0,

                totalErrores:
                    0,

                porcentajeDiasConErrores:
                    0,

                tendencia:
                    "estable"

            };

        }


        // =================================================
        // TIENE ERRORES
        // =================================================

        return {

            estado:
                "Todo bien",

            accion:
                "Auditar",

            diasAuditados:
                diasAuditados,

            diasConErrores:
                diasConErrores,

            totalErrores:
                totalErrores,

            porcentajeDiasConErrores:
                porcentajeDiasConErrores,

            tendencia:
                "estable"

        };

    }


    // =====================================================
    // OBTENER VALOR DE UN DÍA
    // =====================================================

    function obtenerValorDia(
        tecnico,
        dia
    ) {

        if (
            !tecnico ||
            !tecnico.dias
        ) {

            return {

                tipo: "na"

            };

        }


        const valor =
            tecnico.dias[dia];


        // =================================================
        // N/A
        // =================================================

        if (
            valor === undefined ||
            valor === null ||
            valor === "" ||
            String(valor)
                .trim()
                .toUpperCase() === "N/A" ||
            String(valor)
                .trim()
                .toUpperCase() === "NA" ||
            valor === "-"
        ) {

            return {

                tipo: "na"

            };

        }


        // =================================================
        // OK
        // =================================================

        if (
            String(valor)
                .trim()
                .toUpperCase() === "OK"
        ) {

            return {

                tipo: "ok",

                numero: 0

            };

        }


        // =================================================
        // NÚMERO
        // =================================================

        const numero =
            convertirNumero(valor);


        if (
            numero > 0
        ) {

            return {

                tipo: "error",

                numero: numero

            };

        }


        // =================================================
        // CERO = OK
        // =================================================

        if (
            numero === 0
        ) {

            return {

                tipo: "ok",

                numero: 0

            };

        }


        return {

            tipo: "na"

        };

    }


    // =====================================================
    // CONVERTIR NÚMERO
    // =====================================================

    function convertirNumero(valor) {

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {

            return 0;

        }


        if (
            typeof valor === "number"
        ) {

            return Number.isFinite(valor)
                ? Math.max(0, valor)
                : 0;

        }


        let texto =
            String(valor)
                .trim()
                .replace(/\s/g, "")
                .replace("%", "");


        if (
            texto.includes(".") &&
            texto.includes(",")
        ) {

            texto =
                texto
                    .replace(/\./g, "")
                    .replace(",", ".");

        }
        else if (
            texto.includes(",")
        ) {

            texto =
                texto.replace(",", ".");

        }


        const numero =
            Number(texto);


        if (
            !Number.isFinite(numero)
        ) {

            return 0;

        }


        return Math.max(
            0,
            numero
        );

    }


    // =====================================================
    // FORMATEAR NÚMERO
    // =====================================================

    function formatearNumero(numero) {

        return convertirNumero(
            numero
        ).toLocaleString(
            "es-CO",
            {
                maximumFractionDigits: 2
            }
        );

    }


    // =====================================================
    // FORMATEAR FECHA
    // =====================================================

    function formatearDia(fecha) {

        if (!fecha) {

            return "";

        }


        const partes =
            String(fecha).split("-");


        if (
            partes.length !== 3
        ) {

            return escapeHtml(
                fecha
            );

        }


        return `
            ${escapeHtml(
                partes[2]
            )}/${escapeHtml(
                partes[1]
            )}
        `;

    }


    // =====================================================
    // COMPARAR FECHAS
    // =====================================================

    function compararFechas(
        fechaA,
        fechaB
    ) {

        const partesA =
            String(fechaA).split("-");


        const partesB =
            String(fechaB).split("-");


        if (
            partesA.length === 3 &&
            partesB.length === 3
        ) {

            const fechaObjA =
                new Date(
                    Number(partesA[0]),
                    Number(partesA[1]) - 1,
                    Number(partesA[2])
                );


            const fechaObjB =
                new Date(
                    Number(partesB[0]),
                    Number(partesB[1]) - 1,
                    Number(partesB[2])
                );


            return (
                fechaObjA -
                fechaObjB
            );

        }


        return String(
            fechaA
        ).localeCompare(
            String(fechaB)
        );

    }


    // =====================================================
    // ESCAPAR HTML
    // =====================================================

    function escapeHtml(valor) {

        return String(
            valor == null
                ? ""
                : valor
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    // =====================================================
    // FINAL
    // =====================================================

    console.log(
        "✅ Tabla histórica de técnicos cargada correctamente."
    );

});
