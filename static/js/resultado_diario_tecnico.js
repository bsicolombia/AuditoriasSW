document.addEventListener("DOMContentLoaded", function () {

    "use strict";

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
        return;
    }


    // =====================================================
    // VARIABLES
    // =====================================================

    let datos = {};

    let tecnicosOriginales = [];

    let tecnicos = [];

    let dias = [];

    let ordenActual = {

        columna: null,

        indice: null,

        direccion: null

    };


    // =====================================================
    // CARGAR DATOS
    // =====================================================

    function cargarDatos() {

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

            return false;

        }


        // =================================================
        // FECHAS
        // =================================================

        dias =
            Array.isArray(datos.dias)
                ? [...datos.dias].sort(
                    function (a, b) {

                        return compararFechas(
                            b,
                            a
                        );

                    }
                )
                : [];


        // =================================================
        // TÉCNICOS
        // =================================================

        tecnicosOriginales =
            Array.isArray(datos.tecnicos)
                ? [...datos.tecnicos]
                : [];


        tecnicos =
            [...tecnicosOriginales];


        return true;

    }


    // =====================================================
    // INICIALIZAR
    // =====================================================

    if (!cargarDatos()) {
        return;
    }


    // =====================================================
    // RENDER INICIAL
    // =====================================================

    renderizarTabla();


    // =====================================================
    // OBSERVAR CAMBIOS EN LOS DATOS
    //
    // IMPORTANTE:
    // Si el filtro externo modifica el contenido de
    // datos-Resultado-Diario-Tecnico, esta función detecta
    // el cambio y vuelve a ordenar/renderizar.
    // =====================================================

    const observadorDatos =
        new MutationObserver(
            function () {

                actualizarDesdeFiltro();

            }
        );


    observadorDatos.observe(
        datosElemento,
        {
            childList: true,
            characterData: true,
            subtree: true
        }
    );


    // =====================================================
    // DETECTAR CAMBIOS DE FILTROS
    //
    // Esto permite trabajar con filtros externos que no
    // modifican directamente el elemento JSON.
    // =====================================================

    document.addEventListener(
        "change",
        function (evento) {

            const elemento =
                evento.target;

            if (!elemento) {
                return;
            }


            if (
                elemento.matches(
                    "select"
                ) ||
                elemento.matches(
                    "input"
                ) ||
                elemento.matches(
                    "button"
                )
            ) {

                setTimeout(
                    function () {

                        detectarTecnicoFiltrado();

                    },
                    50
                );

            }

        }
    );


    // =====================================================
    // CLICK EN FILTROS
    // =====================================================

    document.addEventListener(
        "click",
        function (evento) {

            const elemento =
                evento.target.closest(
                    "button, [role='button'], option"
                );

            if (!elemento) {
                return;
            }


            setTimeout(
                function () {

                    detectarTecnicoFiltrado();

                },
                80
            );

        }
    );


    // =====================================================
    // ACTUALIZAR DESDE FILTRO
    // =====================================================

    function actualizarDesdeFiltro() {

        const contenido =
            datosElemento.textContent.trim();

        if (!contenido) {
            return;
        }


        try {

            const nuevosDatos =
                JSON.parse(contenido);


            const nuevosTecnicos =
                Array.isArray(
                    nuevosDatos.tecnicos
                )
                    ? [...nuevosDatos.tecnicos]
                    : [];


            const nuevosDias =
                Array.isArray(
                    nuevosDatos.dias
                )
                    ? [...nuevosDatos.dias].sort(
                        function (a, b) {

                            return compararFechas(
                                b,
                                a
                            );

                        }
                    )
                    : [];


            const filtroCambio =
                detectarCambioTecnicos(
                    nuevosTecnicos
                );


            datos =
                nuevosDatos;


            dias =
                nuevosDias;


            tecnicosOriginales =
                nuevosTecnicos;


            tecnicos =
                [...nuevosTecnicos];


            // =================================================
            // SI HAY UN SOLO TÉCNICO FILTRADO
            // SE COLOCA AUTOMÁTICAMENTE DE PRIMERO
            // =================================================

            if (
                tecnicos.length === 1
            ) {

                tecnicos =
                    [...tecnicosOriginales];

            }


            // =================================================
            // SI EXISTE ORDENAMIENTO ACTIVO
            // SE MANTIENE
            // =================================================

            if (
                ordenActual.columna !== null
            ) {

                aplicarOrdenActual();

            }


            renderizarTabla();


        }
        catch (error) {

            console.warn(
                "No se pudieron actualizar los datos de Resultado Diario Técnico.",
                error
            );

        }

    }


    // =====================================================
    // DETECTAR CAMBIO DE TÉCNICOS
    // =====================================================

    function detectarCambioTecnicos(
        nuevosTecnicos
    ) {

        const actuales =
            Array.isArray(
                tecnicosOriginales
            )
                ? tecnicosOriginales
                : [];


        if (
            actuales.length !==
            nuevosTecnicos.length
        ) {

            return true;

        }


        const idsActuales =
            actuales.map(
                obtenerIdentificadorTecnico
            ).sort();


        const idsNuevos =
            nuevosTecnicos.map(
                obtenerIdentificadorTecnico
            ).sort();


        return (
            JSON.stringify(
                idsActuales
            ) !==
            JSON.stringify(
                idsNuevos
            )
        );

    }


    // =====================================================
    // DETECTAR TÉCNICO FILTRADO
    // =====================================================

    function detectarTecnicoFiltrado() {

        /*
         * Buscamos elementos comunes utilizados como filtros.
         *
         * Si encuentra un select con un técnico seleccionado,
         * ordenamos ese técnico primero.
         */

        const selects =
            document.querySelectorAll(
                "select"
            );


        let tecnicoSeleccionado =
            null;


        selects.forEach(
            function (select) {

                if (
                    tecnicoSeleccionado
                ) {
                    return;
                }


                const valor =
                    select.value;


                if (
                    !valor ||
                    valor === "todos" ||
                    valor === "todas" ||
                    valor === "all" ||
                    valor === "*"
                ) {

                    return;

                }


                const texto =
                    select.options &&
                    select.selectedIndex >= 0
                        ? select.options[
                            select.selectedIndex
                        ].textContent.trim()
                        : "";


                const encontrado =
                    buscarTecnico(
                        valor
                    ) ||
                    buscarTecnico(
                        texto
                    );


                if (encontrado) {

                    tecnicoSeleccionado =
                        encontrado;

                }

            }
        );


        // =================================================
        // SI ENCONTRÓ UN TÉCNICO
        // =================================================

        if (
            tecnicoSeleccionado
        ) {

            colocarTecnicoPrimero(
                tecnicoSeleccionado
            );

            return;

        }


        // =================================================
        // TAMBIÉN BUSCAR INPUT
        // =================================================

        const inputs =
            document.querySelectorAll(
                "input"
            );


        inputs.forEach(
            function (input) {

                if (
                    tecnicoSeleccionado
                ) {
                    return;
                }


                const valor =
                    String(
                        input.value || ""
                    ).trim();


                if (!valor) {
                    return;
                }


                const encontrado =
                    buscarTecnico(
                        valor
                    );


                if (encontrado) {

                    tecnicoSeleccionado =
                        encontrado;

                }

            }
        );


        if (
            tecnicoSeleccionado
        ) {

            colocarTecnicoPrimero(
                tecnicoSeleccionado
            );

        }

    }


    // =====================================================
    // BUSCAR TÉCNICO
    // =====================================================

    function buscarTecnico(
        texto
    ) {

        if (
            texto === null ||
            texto === undefined
        ) {

            return null;

        }


        const buscado =
            normalizarTexto(
                texto
            );


        if (!buscado) {
            return null;
        }


        for (
            let i = 0;
            i < tecnicosOriginales.length;
            i++
        ) {

            const tecnico =
                tecnicosOriginales[i];


            const nombre =
                normalizarTexto(
                    tecnico.tecnico ||
                    tecnico.nombre ||
                    tecnico.nombreTecnico ||
                    ""
                );


            const id =
                normalizarTexto(
                    tecnico.id ||
                    tecnico.tecnicoId ||
                    tecnico.idTecnico ||
                    ""
                );


            if (
                nombre === buscado ||
                id === buscado
            ) {

                return tecnico;

            }

        }


        return null;

    }


    // =====================================================
    // COLOCAR TÉCNICO PRIMERO
    // =====================================================

    function colocarTecnicoPrimero(
        tecnicoSeleccionado
    ) {

        if (
            !tecnicoSeleccionado
        ) {
            return;
        }


        const seleccionadoId =
            obtenerIdentificadorTecnico(
                tecnicoSeleccionado
            );


        const indice =
            tecnicos.findIndex(
                function (tecnico) {

                    return (
                        obtenerIdentificadorTecnico(
                            tecnico
                        ) ===
                        seleccionadoId
                    );

                }
            );


        if (
            indice <= 0
        ) {

            return;

        }


        const tecnico =
            tecnicos.splice(
                indice,
                1
            )[0];


        tecnicos.unshift(
            tecnico
        );


        renderizarTabla();

    }


    // =====================================================
    // IDENTIFICADOR TÉCNICO
    // =====================================================

    function obtenerIdentificadorTecnico(
        tecnico
    ) {

        if (!tecnico) {
            return "";
        }


        return normalizarTexto(
            tecnico.id ||
            tecnico.tecnicoId ||
            tecnico.idTecnico ||
            tecnico.codigo ||
            tecnico.tecnico ||
            tecnico.nombre ||
            tecnico.nombreTecnico ||
            ""
        );

    }


    // =====================================================
    // NORMALIZAR TEXTO
    // =====================================================

    function normalizarTexto(
        texto
    ) {

        return String(
            texto == null
                ? ""
                : texto
        )
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );

    }


    // =====================================================
    // RENDERIZAR TABLA
    // =====================================================

    function renderizarTabla() {

        head.innerHTML = "";

        body.innerHTML = "";

        foot.innerHTML = "";


        // =================================================
        // SIN TÉCNICOS
        // =================================================

        if (!tecnicos.length) {

            body.innerHTML = `
                <tr>
                    <td
                        colspan="${Math.max(
                            dias.length + 4,
                            1
                        )}"
                        class="tabla-sin-datos"
                    >
                        No hay técnicos para mostrar.
                    </td>
                </tr>
            `;

            return;

        }


        // =================================================
        // RESUMEN POR DÍA
        // =================================================

        const resumenDias = {};


        dias.forEach(
            function (dia) {

                resumenDias[dia] = {

                    tecnicosAuditados: 0,

                    errores: 0

                };

            }
        );


        let erroresGenerales = 0;


        // =================================================
        // CALCULAR RESUMEN
        // =================================================

        tecnicos.forEach(
            function (tecnico) {

                dias.forEach(
                    function (dia) {

                        const valor =
                            obtenerValorDia(
                                tecnico,
                                dia
                            );


                        if (
                            valor.tipo === "ok" ||
                            valor.tipo === "error"
                        ) {

                            resumenDias[dia]
                                .tecnicosAuditados++;

                        }


                        if (
                            valor.tipo === "error"
                        ) {

                            resumenDias[dia]
                                .errores +=
                                valor.numero;


                            erroresGenerales +=
                                valor.numero;

                        }

                    }
                );

            }
        );


        // =================================================
        // ENCABEZADO
        // =================================================

        const encabezado =
            document.createElement(
                "tr"
            );


        let encabezadoHtml = `

            <th class="columna-tecnico">
                Técnico
            </th>

        `;


        dias.forEach(
            function (dia, indice) {

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
                            title="Ordenar por ${escapeHtml(
                                dia
                            )}"
                        >

                            <span class="dia-texto">
                                ${formatearDia(
                                    dia
                                )}
                            </span>

                            <span class="icono-orden">
                                ${obtenerIconoOrden(
                                    estadoOrden
                                )}
                            </span>

                        </button>

                    </th>

                `;

            }
        );


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
            document.createElement(
                "tr"
            );


        filaAuditados.className =
            "fila-tecnicos-auditados";


        let auditadosHtml = `

            <td class="nombre-tecnicos-auditados">
                TÉCNICOS AUDITADOS
            </td>

        `;


        dias.forEach(
            function (dia) {

                const cantidad =
                    resumenDias[dia]
                        .tecnicosAuditados;


                auditadosHtml += `

                    <td
                        class="tecnicos-auditados-dia"
                        title="${cantidad} técnico(s) auditado(s) el ${escapeHtml(
                            dia
                        )}"
                    >

                        ${formatearNumero(
                            cantidad
                        )}

                    </td>

                `;

            }
        );


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
            dias.some(
                function (dia) {

                    return (
                        resumenDias[dia]
                            .tecnicosAuditados > 0
                    );

                }
            );


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
        // EVENTOS DE ORDENAMIENTO
        // =================================================

        head.querySelectorAll(
            ".boton-orden-dia"
        ).forEach(
            function (boton) {

                boton.addEventListener(
                    "click",
                    function () {

                        const indice =
                            Number(
                                boton.dataset
                                    .ordenDia
                            );


                        ordenarPorDia(
                            indice
                        );

                    }
                );

            }
        );


        head.querySelectorAll(
            ".boton-orden-columna"
        ).forEach(
            function (boton) {

                boton.addEventListener(
                    "click",
                    function () {

                        const columna =
                            boton.dataset
                                .ordenColumna;


                        ordenarPorColumna(
                            columna
                        );

                    }
                );

            }
        );


        // =================================================
        // FILAS DE TÉCNICOS
        // =================================================

        tecnicos.forEach(
            function (tecnico) {

                const fila =
                    document.createElement(
                        "tr"
                    );


                const analisis =
                    analizarHistoricoTecnico(
                        tecnico,
                        dias
                    );


                // =========================================
                // NOMBRE
                // =========================================

                let html = `

                    <td class="nombre-tecnico">

                        ${escapeHtml(
                            tecnico.tecnico ||
                            tecnico.nombre ||
                            tecnico.nombreTecnico ||
                            "Sin nombre"
                        )}

                    </td>

                `;


                // =========================================
                // DÍAS
                // =========================================

                dias.forEach(
                    function (dia) {

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

                    }
                );


                // =========================================
                // ERRORES
                // =========================================

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


                // =========================================
                // ESTADO
                // =========================================

                let claseEstado =
                    "estado-todo-bien";


                if (
                    analisis.estado ===
                    "Mejora"
                ) {

                    claseEstado =
                        "estado-mejora";

                }
                else if (
                    analisis.estado ===
                    "Crítico"
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


                // =========================================
                // ACCIÓN
                // =========================================

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

            }
        );

    }


    // =====================================================
    // ORDENAMIENTO
    // =====================================================

    function ordenarPorDia(
        indiceDia
    ) {

        cambiarOrden(
            "dia",
            indiceDia
        );

    }


    function ordenarPorColumna(
        columna
    ) {

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
            ordenActual.columna ===
            null
        ) {

            tecnicos =
                [...tecnicosOriginales];

            renderizarTabla();

            return;

        }


        aplicarOrdenActual();

        renderizarTabla();

    }


    // =====================================================
    // APLICAR ORDEN ACTUAL
    // =====================================================

    function aplicarOrdenActual() {

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


                    return (
                        ordenActual.direccion ===
                        "asc"
                            ? valorA - valorB
                            : valorB - valorA
                    );

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


                    return (
                        ordenActual.direccion ===
                        "asc"
                            ? valorA - valorB
                            : valorB - valorA
                    );

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


                    return (
                        ordenActual.direccion ===
                        "asc"
                            ? valorA - valorB
                            : valorB - valorA
                    );

                }
            );

        }

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


        dias.forEach(
            function (dia) {

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

            }
        );


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

                    return (
                        acumulado +
                        item.errores
                    );

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

                    return (
                        acumulado +
                        item.errores
                    );

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

                    return (
                        acumulado +
                        item.errores
                    );

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
            convertirNumero(
                valor
            );


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
    // CONVERTIR NÚMERO
    // =====================================================

    function convertirNumero(
        valor
    ) {

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

            return Number.isFinite(
                valor
            )
                ? Math.max(
                    0,
                    valor
                )
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
                texto.replace(
                    ",",
                    "."
                );

        }


        const numero =
            Number(texto);


        if (
            !Number.isFinite(
                numero
            )
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

    function formatearNumero(
        numero
    ) {

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

    function formatearDia(
        fecha
    ) {

        if (!fecha) {
            return "";
        }


        const partes =
            String(fecha).split(
                "-"
            );


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
            String(fechaA).split(
                "-"
            );


        const partesB =
            String(fechaB).split(
                "-"
            );


        if (
            partesA.length === 3 &&
            partesB.length === 3
        ) {

            const fechaObjA =
                new Date(
                    Number(
                        partesA[0]
                    ),
                    Number(
                        partesA[1]
                    ) - 1,
                    Number(
                        partesA[2]
                    )
                );


            const fechaObjB =
                new Date(
                    Number(
                        partesB[0]
                    ),
                    Number(
                        partesB[1]
                    ) - 1,
                    Number(
                        partesB[2]
                    )
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

    function escapeHtml(
        valor
    ) {

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

});
