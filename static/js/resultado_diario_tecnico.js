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

        datos = JSON.parse(contenido);

    }
    catch (error) {

        console.error(
            "❌ Error leyendo Resultado_Diario_Tecnico:",
            error
        );

        body.innerHTML = `
            <tr>
                <td colspan="100" class="tabla-sin-datos">
                    Error cargando los datos.
                </td>
            </tr>
        `;

        return;
    }


    // =====================================================
    // ORDENAR FECHAS
    // =====================================================

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
    // ORDENAMIENTO
    // =====================================================

    let ordenActual = {

        columna: null,

        indice: null,

        direccion: null

    };


    // =====================================================
    // LIMPIAR
    // =====================================================

    head.innerHTML = "";

    body.innerHTML = "";

    foot.innerHTML = "";


    // =====================================================
    // SIN TÉCNICOS
    // =====================================================

    if (!tecnicos.length) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="${Math.max(dias.length + 4, 1)}"
                    class="tabla-sin-datos"
                >
                    No hay técnicos para mostrar.
                </td>
            </tr>
        `;

        return;
    }


    // =====================================================
    // RENDER
    // =====================================================

    renderizarTabla();


    // =====================================================
    // RENDERIZAR
    // =====================================================

    function renderizarTabla() {

        head.innerHTML = "";

        body.innerHTML = "";

        foot.innerHTML = "";


        // =================================================
        // RESUMEN POR DÍA
        // =================================================

        const resumenDias = {};

        dias.forEach(function (dia) {

            resumenDias[dia] = {

                tecnicosAuditados: 0,

                errores: 0

            };

        });




        let erroresGenerales = 0;


        // =================================================
        // CALCULAR RESUMEN
        // =================================================

        tecnicos.forEach(function (tecnico) {

            dias.forEach(function (dia) {

                const valor =
                    obtenerValorDia(
                        tecnico,
                        dia
                    );


                // -----------------------------------------
                // TÉCNICO AUDITADO ESE DÍA
                // -----------------------------------------

                if (
                    valor.tipo === "ok" ||
                    valor.tipo === "error"
                ) {

                    resumenDias[dia]
                        .tecnicosAuditados++;


                }


                // -----------------------------------------
                // ERRORES
                // -----------------------------------------

                if (
                    valor.tipo === "error"
                ) {

                    resumenDias[dia].errores +=
                        valor.numero;

                    erroresGenerales +=
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
        // DÍAS
        // =================================================

        dias.forEach(function (dia, indice) {

            const estadoOrden =
                obtenerEstadoOrden(
                    "dia",
                    indice
                );

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

                        <span class="icono-orden">
                            ${obtenerIconoOrden(
                                estadoOrden
                            )}
                        </span>

                    </button>

                </th>

            `;

        });


        // =================================================
        // ERRORES
        // =================================================

        const estadoErrores =
            obtenerEstadoOrden(
                "errores"
            );

        encabezadoHtml += `

            <th class="columna-errores">

                <button
                    type="button"
                    class="boton-orden-columna"
                    data-orden-columna="errores"
                    title="Ordenar por errores"
                >

                    <span>
                        Errores
                    </span>

                    <span class="icono-orden-columna">
                        ${obtenerIconoOrden(
                            estadoErrores
                        )}
                    </span>

                </button>

            </th>

        `;


        // =================================================
        // ESTADO
        // =================================================

        const estadoEstado =
            obtenerEstadoOrden(
                "estado"
            );

        encabezadoHtml += `

            <th class="columna-estado">

                <button
                    type="button"
                    class="boton-orden-columna"
                    data-orden-columna="estado"
                    title="Ordenar por estado"
                >

                    <span>
                        Estado
                    </span>

                    <span class="icono-orden-columna">
                        ${obtenerIconoOrden(
                            estadoEstado
                        )}
                    </span>

                </button>

            </th>

        `;


        // =================================================
        // ACCIÓN
        // =================================================

        const estadoAccion =
            obtenerEstadoOrden(
                "accion"
            );

        encabezadoHtml += `

            <th class="columna-accion">

                <button
                    type="button"
                    class="boton-orden-columna"
                    data-orden-columna="accion"
                    title="Ordenar por acción"
                >

                    <span>
                        Acción
                    </span>

                    <span class="icono-orden-columna">
                        ${obtenerIconoOrden(
                            estadoAccion
                        )}
                    </span>

                </button>

            </th>

        `;


        encabezado.innerHTML =
            encabezadoHtml;

        head.appendChild(
            encabezado
        );


        // =================================================
        // FILA TÉCNICOS AUDITADOS
        // =================================================

        const filaAuditados =
            document.createElement("tr");

        filaAuditados.className =
            "fila-tecnicos-auditados";


        let auditadosHtml = `

            <td class="nombre-tecnicos-auditados">
                TÉCNICOS AUDITADOS
            </td>

        `;


        // =================================================
        // CANTIDAD POR CADA DÍA
        // =================================================

        dias.forEach(function (dia) {

            const cantidad =
                resumenDias[dia]
                    .tecnicosAuditados;

            auditadosHtml += `

                <td
                    class="tecnicos-auditados-dia"
                    title="${cantidad} técnico(s) auditado(s) el ${escapeHtml(dia)}"
                >

                    ${formatearNumero(
                        cantidad
                    )}

                </td>

            `;

        });

        // =================================================
        // TOTAL ERRORES
        // =================================================

        auditadosHtml += `

            <td class="total-errores-general">

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


        const hayAuditorias =
            dias.some(function (dia) {

                return resumenDias[dia].tecnicosAuditados > 0;

            });

        if (!hayAuditorias) {

            estadoGeneral =
                "Sin auditorías";

            claseEstadoGeneral =
                "estado-sin-auditorias";

        }

        auditadosHtml += `

            <td class="estado-general">

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

        auditadosHtml += `

            <td class="accion-general">

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


        filaAuditados.innerHTML =
            auditadosHtml;

        head.appendChild(
            filaAuditados
        );


        // =================================================
        // EVENTOS DÍAS
        // =================================================

        head.querySelectorAll(
            ".boton-orden-dia"
        ).forEach(function (boton) {

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

        });


        // =================================================
        // EVENTOS COLUMNAS
        // =================================================

        head.querySelectorAll(
            ".boton-orden-columna"
        ).forEach(function (boton) {

            boton.addEventListener(
                "click",
                function () {

                    const columna =
                        boton.dataset.ordenColumna;

                    ordenarPorColumna(
                        columna
                    );

                }
            );

        });


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


                if (
                    valor.tipo === "na"
                ) {

                    html += `

                        <td class="celda-na">
                            N/A
                        </td>

                    `;

                    return;
                }


                if (
                    valor.tipo === "ok"
                ) {

                    html += `

                        <td class="celda-ok">
                            OK
                        </td>

                    `;

                    return;
                }


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


                html += `

                    <td class="celda-na">
                        N/A
                    </td>

                `;

            });


            // =================================================
            // ERRORES
            // =================================================

            const errores =
                analisis.totalErrores;

            html += `

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
                analisis.estado ===
                "Sin auditorías"
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

    }


    // =====================================================
    // ORDENAR
    // =====================================================

    function ordenarPorDia(indiceDia) {

        cambiarOrden(
            "dia",
            indiceDia
        );

    }


    function ordenarPorColumna(columna) {

        cambiarOrden(
            columna
        );

    }


    function cambiarOrden(
        columna,
        indice = null
    ) {

        const mismaColumna =
            ordenActual.columna === columna &&
            ordenActual.indice === indice;


        if (!mismaColumna) {

            ordenActual.columna =
                columna;

            ordenActual.indice =
                indice;

            ordenActual.direccion =
                "desc";

        }
        else if (
            ordenActual.direccion ===
            "desc"
        ) {

            ordenActual.direccion =
                "asc";

        }
        else {

            ordenActual.columna =
                null;

            ordenActual.indice =
                null;

            ordenActual.direccion =
                null;

        }


        if (
            ordenActual.columna === null
        ) {

            tecnicos =
                [...tecnicosOriginales];

            renderizarTabla();

            return;

        }


        if (
            ordenActual.columna ===
            "dia"
        ) {

            const dia =
                dias[
                    ordenActual.indice
                ];


            tecnicos.sort(
                function (a, b) {

                    const valorA =
                        obtenerValorOrden(
                            a,
                            dia
                        );

                    const valorB =
                        obtenerValorOrden(
                            b,
                            dia
                        );


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


                    if (
                        valorA.na &&
                        valorB.na
                    ) {

                        return 0;

                    }


                    if (
                        ordenActual.direccion ===
                        "asc"
                    ) {

                        return (
                            valorA.numero -
                            valorB.numero
                        );

                    }


                    return (
                        valorB.numero -
                        valorA.numero
                    );

                }
            );

        }


        else if (
            ordenActual.columna ===
            "errores"
        ) {

            tecnicos.sort(
                function (a, b) {

                    const analisisA =
                        analizarHistoricoTecnico(
                            a,
                            dias
                        );

                    const analisisB =
                        analizarHistoricoTecnico(
                            b,
                            dias
                        );


                    const valorA =
                        analisisA.totalErrores;

                    const valorB =
                        analisisB.totalErrores;


                    return ordenActual.direccion ===
                        "asc"

                        ? valorA - valorB

                        : valorB - valorA;

                }
            );

        }


        else if (
            ordenActual.columna ===
            "estado"
        ) {

            const prioridadEstado = {

                "Crítico": 4,

                "Mejora": 3,

                "Todo bien": 2,

                "Sin auditorías": 1

            };


            tecnicos.sort(
                function (a, b) {

                    const analisisA =
                        analizarHistoricoTecnico(
                            a,
                            dias
                        );

                    const analisisB =
                        analizarHistoricoTecnico(
                            b,
                            dias
                        );


                    const valorA =
                        prioridadEstado[
                            analisisA.estado
                        ] || 0;

                    const valorB =
                        prioridadEstado[
                            analisisB.estado
                        ] || 0;


                    return ordenActual.direccion ===
                        "asc"

                        ? valorA - valorB

                        : valorB - valorA;

                }
            );

        }


        else if (
            ordenActual.columna ===
            "accion"
        ) {

            const prioridadAccion = {

                "Volver a auditar": 3,

                "Mantener seguimiento": 2,

                "Auditar": 1

            };


            tecnicos.sort(
                function (a, b) {

                    const analisisA =
                        analizarHistoricoTecnico(
                            a,
                            dias
                        );

                    const analisisB =
                        analizarHistoricoTecnico(
                            b,
                            dias
                        );


                    const valorA =
                        prioridadAccion[
                            analisisA.accion
                        ] || 0;

                    const valorB =
                        prioridadAccion[
                            analisisB.accion
                        ] || 0;


                    return ordenActual.direccion ===
                        "asc"

                        ? valorA - valorB

                        : valorB - valorA;

                }
            );

        }


        renderizarTabla();

    }


    // =====================================================
    // ICONOS
    // =====================================================

    function obtenerIconoOrden(
        estado
    ) {

        if (
            estado === "asc"
        ) {

            return "↑";

        }


        if (
            estado === "desc"
        ) {

            return "↓";

        }


        return "↕";

    }


    function obtenerEstadoOrden(
        columna,
        indice = null
    ) {

        if (
            ordenActual.columna !==
            columna
        ) {

            return null;

        }


        if (
            columna === "dia" &&
            ordenActual.indice !== indice
        ) {

            return null;

        }


        return ordenActual.direccion;

    }


    // =====================================================
    // ANÁLISIS HISTÓRICO
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


            historico.push({

                dia: dia,

                errores:
                    valor.tipo === "error"
                        ? valor.numero
                        : 0,

                auditado: true

            });

        });


        if (
            historico.length === 0
        ) {

            return {

                estado:
                    "Sin auditorías",

                accion:
                    "Auditar",

                tecnicosAuditados:
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


        const diasAuditados =
            historico.length;


        const diasConErrores =
            historico.filter(
                function (item) {

                    return item.errores > 0;

                }
            ).length;


        const totalErrores =
            historico.reduce(
                function (
                    acumulado,
                    item
                ) {

                    return acumulado +
                        item.errores;

                },
                0
            );


        const porcentajeDiasConErrores =
            (
                diasConErrores /
                diasAuditados
            ) * 100;


        const ultimas =
            historico.slice(-3);


        const ultimasSinErrores =
            ultimas.length >= 2 &&
            ultimas.every(
                function (item) {

                    return item.errores === 0;

                }
            );


        const anteriores =
            historico.slice(
                0,
                Math.max(
                    historico.length - 3,
                    0
                )
            );


        const erroresAnteriores =
            anteriores.reduce(
                function (
                    acumulado,
                    item
                ) {

                    return acumulado +
                        item.errores;

                },
                0
            );


        const promedioAnterior =
            anteriores.length > 0
                ? erroresAnteriores /
                    anteriores.length
                : 0;


        const erroresRecientes =
            ultimas.reduce(
                function (
                    acumulado,
                    item
                ) {

                    return acumulado +
                        item.errores;

                },
                0
            );


        const promedioReciente =
            ultimas.length > 0
                ? erroresRecientes /
                    ultimas.length
                : 0;


        let estaMejorando =
            false;


        if (
            anteriores.length >= 2 &&
            promedioAnterior > 0 &&
            promedioReciente <
                promedioAnterior
        ) {

            estaMejorando = true;

        }


        if (
            ultimasSinErrores &&
            diasConErrores > 0
        ) {

            estaMejorando = true;

        }


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

                    tecnicosAuditados:
                        1,

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

                tecnicosAuditados:
                    1,

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


        if (
            estaMejorando
        ) {

            return {

                estado:
                    "Mejora",

                accion:
                    "Mantener seguimiento",

                tecnicosAuditados:
                    1,

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
                "Todo bien",

            accion:
                "Auditar",

            tecnicosAuditados:
                1,

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
    // OBTENER VALOR DEL DÍA
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
    // VALOR PARA ORDENAR
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
    // NÚMERO
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
    // FORMATEAR DÍA
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


    console.log(
        "✅ Tabla histórica cargada correctamente."
    );

});
