document.addEventListener("DOMContentLoaded", function () {

    "use strict";


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const datosElemento =
        document.getElementById(
            "datos-Resultado-Total-Diario-Tecnico"
        );

    const tabla =
        document.getElementById(
            "tablaAuditoriasTotalesDiarioTecnico"
        );

    const head =
        document.getElementById(
            "tablaAuditoriasTotalesDiarioTecnicoHead"
        );

    const body =
        document.getElementById(
            "tablaAuditoriasTotalesDiarioTecnicoBody"
        );

    const foot =
        document.getElementById(
            "tablaAuditoriasTotalesDiarioTecnicoFoot"
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

            console.error(
                "Error cargando datos:",
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


            return false;

        }


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


    renderizarTabla();


    // =====================================================
    // OBSERVAR CAMBIOS EN LOS DATOS
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
                elemento.matches("select") ||
                elemento.matches("input") ||
                elemento.matches("button")
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
                Array.isArray(nuevosDatos.tecnicos)
                    ? [...nuevosDatos.tecnicos]
                    : [];


            const nuevosDias =
                Array.isArray(nuevosDatos.dias)
                    ? [...nuevosDatos.dias].sort(
                        function (a, b) {

                            return compararFechas(
                                b,
                                a
                            );

                        }
                    )
                    : [];


            datos = nuevosDatos;

            dias = nuevosDias;

            tecnicosOriginales = nuevosTecnicos;

            tecnicos = [...nuevosTecnicos];


            if (ordenActual.columna !== null) {

                aplicarOrdenActual();

            }


            renderizarTabla();


        }
        catch (error) {

            console.warn(
                "No se pudieron actualizar los datos de Auditorías Totales Diario Técnico.",
                error
            );

        }

    }


    // =====================================================
    // DETECTAR TÉCNICO FILTRADO
    // =====================================================

    function detectarTecnicoFiltrado() {

        const selects =
            document.querySelectorAll("select");


        let tecnicoSeleccionado = null;


        selects.forEach(
            function (select) {

                if (tecnicoSeleccionado) {
                    return;
                }


                const valor = select.value;


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
                    buscarTecnico(valor) ||
                    buscarTecnico(texto);


                if (encontrado) {

                    tecnicoSeleccionado =
                        encontrado;

                }

            }
        );


        if (tecnicoSeleccionado) {

            colocarTecnicoPrimero(
                tecnicoSeleccionado
            );

            return;

        }


        const inputs =
            document.querySelectorAll("input");


        inputs.forEach(
            function (input) {

                if (tecnicoSeleccionado) {
                    return;
                }


                const valor =
                    String(input.value || "").trim();


                if (!valor) {
                    return;
                }


                const encontrado =
                    buscarTecnico(valor);


                if (encontrado) {

                    tecnicoSeleccionado =
                        encontrado;

                }

            }
        );


        if (tecnicoSeleccionado) {

            colocarTecnicoPrimero(
                tecnicoSeleccionado
            );

        }

    }


    // =====================================================
    // BUSCAR TÉCNICO
    // =====================================================

    function buscarTecnico(texto) {

        if (
            texto === null ||
            texto === undefined
        ) {

            return null;

        }


        const buscado =
            normalizarTexto(texto);


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
                    tecnico.cedula ||
                    tecnico.tecnico_cedula ||
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

        if (!tecnicoSeleccionado) {
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
                        ) === seleccionadoId
                    );

                }
            );


        if (indice <= 0) {
            return;
        }


        const tecnico =
            tecnicos.splice(indice, 1)[0];


        tecnicos.unshift(tecnico);


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
            tecnico.cedula ||
            tecnico.tecnico_cedula ||
            tecnico.tecnico ||
            tecnico.nombre ||
            tecnico.nombreTecnico ||
            ""
        );

    }


    // =====================================================
    // NORMALIZAR TEXTO
    // =====================================================

    function normalizarTexto(texto) {

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


        if (!tecnicos.length) {

            body.innerHTML = `
                <tr>
                    <td
                        colspan="${Math.max(
                            dias.length + 3,
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

                    totalAuditorias: 0,

                    totalCumplen: 0

                };

            }
        );


        let totalGeneral = 0;

        let totalCumplenGeneral = 0;


        tecnicos.forEach(
            function (tecnico) {

                dias.forEach(
                    function (dia) {

                        const cantidad =
                            obtenerCantidadDia(
                                tecnico,
                                dia
                            );


                        const cumplen =
                            obtenerCumplenDia(
                                tecnico,
                                dia
                            );


                        if (cantidad > 0) {

                            resumenDias[dia]
                                .tecnicosAuditados++;

                            resumenDias[dia]
                                .totalAuditorias += cantidad;

                            totalGeneral += cantidad;

                        }


                        if (cumplen > 0) {

                            resumenDias[dia]
                                .totalCumplen += cumplen;

                            totalCumplenGeneral += cumplen;

                        }

                    }
                );

            }
        );


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
                            title="Ordenar por ${escapeHtml(dia)}"
                        >

                            <span class="dia-texto">
                                ${formatearDia(dia)}
                            </span>

                            <span class="icono-orden-auditorias-totales">
                                ${obtenerIconoOrden(
                                    estadoOrden
                                )}
                            </span>

                        </button>

                    </th>

                `;

            }
        );


        const estadoTotal =
            obtenerEstadoOrden("total");


        encabezadoHtml += `

            <th class="columna-total">

                <button
                    type="button"
                    class="boton-orden-columna"
                    data-orden-columna="total"
                    title="Ordenar por total"
                >

                    <span>
                        Total
                    </span>

                    <span class="icono-orden-auditorias-totales">
                        ${obtenerIconoOrden(
                            estadoTotal
                        )}
                    </span>

                </button>

            </th>

        `;


        encabezadoHtml += `

            <th class="columna-estado">
                Estado
            </th>

        `;


        encabezado.innerHTML =
            encabezadoHtml;


        head.appendChild(encabezado);


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


        dias.forEach(
            function (dia) {

                const cantidad =
                    resumenDias[dia]
                        .tecnicosAuditados;


                auditadosHtml += `

                    <td
                        class="tecnicos-auditados-dia"
                        title="${cantidad} técnico(s) auditado(s) el ${escapeHtml(dia)}"
                    >

                        ${formatearNumero(cantidad)}

                    </td>

                `;

            }
        );


        auditadosHtml += `

            <td class="total-auditorias-general">

                ${formatearNumero(
                    totalGeneral
                )}

            </td>

        `;


        const hayAuditorias =
            dias.some(
                function (dia) {

                    return (
                        resumenDias[dia]
                            .tecnicosAuditados > 0
                    );

                }
            );


        auditadosHtml += `

            <td class="estado-general">

                <span
                    class="${
                        hayAuditorias
                            ? "estado-badge-auditado"
                            : "estado-badge-sin-auditorias"
                    }"
                >

                    ${
                        hayAuditorias
                            ? "Con auditorías"
                            : "Sin auditorías"
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
        // FILA TOTAL DE AUDITORÍAS
        // =================================================

        const filaTotales =
            document.createElement("tr");


        filaTotales.className =
            "fila-total-auditorias-dia";


        let totalesHtml = `

            <td class="nombre-total-auditorias">
                TOTAL AUDITORÍAS
            </td>

        `;


        dias.forEach(
            function (dia) {

                const totalDia =
                    resumenDias[dia]
                        .totalAuditorias;


                totalesHtml += `

                    <td
                        class="total-auditorias-dia"
                        title="Total de auditorías realizadas el ${escapeHtml(dia)}"
                    >

                        ${formatearNumero(
                            totalDia
                        )}

                    </td>

                `;

            }
        );


        totalesHtml += `

            <td class="total-auditorias-general">

                ${formatearNumero(
                    totalGeneral
                )}

            </td>

        `;


        totalesHtml += `

            <td class="estado-general">

                <span class="estado-badge-auditado">
                    Total
                </span>

            </td>

        `;


        filaTotales.innerHTML =
            totalesHtml;


        head.appendChild(
            filaTotales
        );


        // =================================================
        // FILA TOTAL AUDITORÍAS QUE CUMPLEN
        // =================================================

        const filaCumplen =
            document.createElement("tr");


        filaCumplen.className =
            "fila-total-auditorias-cumplen-dia";


        let cumplenHtml = `

            <td class="nombre-total-auditorias-cumplen">
                AUDITORÍAS CUMPLEN
            </td>

        `;


        dias.forEach(
            function (dia) {

                const totalCumpleDia =
                    resumenDias[dia]
                        .totalCumplen;


                cumplenHtml += `

                    <td
                        class="total-auditorias-cumplen-dia"
                        title="Total de auditorías que cumplen el ${escapeHtml(dia)}"
                    >

                        ${formatearNumero(
                            totalCumpleDia
                        )}

                    </td>

                `;

            }
        );


        cumplenHtml += `

            <td class="total-auditorias-cumplen-general">

                ${formatearNumero(
                    totalCumplenGeneral
                )}

            </td>

        `;


        cumplenHtml += `

            <td class="estado-general">

                <span class="estado-badge-auditado">
                    Cumplen
                </span>

            </td>

        `;


        filaCumplen.innerHTML =
            cumplenHtml;


        head.appendChild(
            filaCumplen
        );


        // =================================================
        // EVENTOS DE ORDENAMIENTO POR DÍA
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
                                boton.dataset.ordenDia
                            );


                        cambiarOrden(
                            "dia",
                            indice
                        );

                    }
                );

            }
        );


        // =================================================
        // EVENTO DE ORDENAMIENTO POR TOTAL
        // =================================================

        head.querySelectorAll(
            ".boton-orden-columna"
        ).forEach(
            function (boton) {

                boton.addEventListener(
                    "click",
                    function () {

                        const columna =
                            boton.dataset.ordenColumna;


                        cambiarOrden(
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
                    document.createElement("tr");


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


                let totalTecnico = 0;


                dias.forEach(
                    function (dia) {

                        const cantidad =
                            obtenerCantidadDia(
                                tecnico,
                                dia
                            );


                        if (cantidad > 0) {

                            totalTecnico +=
                                cantidad;


                            html += `

                                <td
                                    class="celda-cantidad"
                                    data-valor-orden="${cantidad}"
                                >

                                    ${formatearNumero(
                                        cantidad
                                    )}

                                </td>

                            `;

                        }
                        else {

                            html += `

                                <td class="celda-na">
                                    N/A
                                </td>

                            `;

                        }

                    }
                );


                html += `

                    <td
                        class="celda-cantidad"
                        data-valor-orden="${totalTecnico}"
                    >

                        ${formatearNumero(
                            totalTecnico
                        )}

                    </td>

                `;


                html += `

                    <td>

                        <span
                            class="${
                                totalTecnico > 0
                                    ? "estado-badge-auditado"
                                    : "estado-badge-sin-auditorias"
                            }"
                        >

                            ${
                                totalTecnico > 0
                                    ? "Auditado"
                                    : "Sin auditorías"
                            }

                        </span>

                    </td>

                `;


                fila.innerHTML = html;


                body.appendChild(fila);

            }
        );

    }


    // =====================================================
    // ORDENAMIENTO
    // =====================================================

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
            ordenActual.direccion === "desc"
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


        if (ordenActual.columna === null) {

            tecnicos =
                [...tecnicosOriginales];

            renderizarTabla();

            return;

        }


        aplicarOrdenActual();

        renderizarTabla();

    }


    function aplicarOrdenActual() {

        if (
            ordenActual.columna === "dia"
        ) {

            const dia =
                dias[
                    ordenActual.indice
                ];


            tecnicos.sort(
                function (a, b) {

                    const valorA =
                        obtenerCantidadDia(
                            a,
                            dia
                        );


                    const valorB =
                        obtenerCantidadDia(
                            b,
                            dia
                        );


                    const diferencia =
                        ordenActual.direccion === "asc"
                            ? valorA - valorB
                            : valorB - valorA;


                    if (diferencia !== 0) {
                        return diferencia;
                    }


                    return compararNombres(
                        a,
                        b
                    );

                }
            );

        }
        else if (
            ordenActual.columna === "total"
        ) {

            tecnicos.sort(
                function (a, b) {

                    const valorA =
                        obtenerTotalTecnico(a);


                    const valorB =
                        obtenerTotalTecnico(b);


                    const diferencia =
                        ordenActual.direccion === "asc"
                            ? valorA - valorB
                            : valorB - valorA;


                    if (diferencia !== 0) {
                        return diferencia;
                    }


                    return compararNombres(
                        a,
                        b
                    );

                }
            );

        }

    }


    // =====================================================
    // COMPARAR NOMBRES
    // =====================================================

    function compararNombres(
        tecnicoA,
        tecnicoB
    ) {

        const nombreA =
            normalizarTexto(
                tecnicoA.tecnico ||
                tecnicoA.nombre ||
                tecnicoA.nombreTecnico ||
                ""
            );


        const nombreB =
            normalizarTexto(
                tecnicoB.tecnico ||
                tecnicoB.nombre ||
                tecnicoB.nombreTecnico ||
                ""
            );


        return nombreA.localeCompare(
            nombreB,
            "es",
            {
                sensitivity: "base"
            }
        );

    }


    // =====================================================
    // ICONOS
    // =====================================================

    function obtenerIconoOrden(
        estado
    ) {

        if (estado === "asc") {
            return "↑";
        }


        if (estado === "desc") {
            return "↓";
        }


        return "↕";

    }


    function obtenerEstadoOrden(
        columna,
        indice = null
    ) {

        if (
            ordenActual.columna !== columna
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
    // OBTENER CANTIDAD DEL DÍA
    // =====================================================

    function obtenerCantidadDia(
        tecnico,
        dia
    ) {

        if (
            !tecnico ||
            !tecnico.dias
        ) {

            return 0;

        }


        const valor =
            tecnico.dias[dia];


        return convertirNumero(
            valor
        );

    }


    // =====================================================
    // OBTENER CUMPLEN DEL DÍA
    // =====================================================

    function obtenerCumplenDia(
        tecnico,
        dia
    ) {

        if (
            !tecnico ||
            !tecnico.cumplen
        ) {

            return 0;

        }


        const valor =
            tecnico.cumplen[dia];


        return convertirNumero(
            valor
        );

    }


    // =====================================================
    // TOTAL POR TÉCNICO
    // =====================================================

    function obtenerTotalTecnico(
        tecnico
    ) {

        if (
            !tecnico
        ) {

            return 0;

        }


        if (
            tecnico.total !== undefined &&
            tecnico.total !== null
        ) {

            return convertirNumero(
                tecnico.total
            );

        }


        if (
            !tecnico.dias
        ) {

            return 0;

        }


        return Object.values(
            tecnico.dias
        ).reduce(
            function (
                acumulado,
                valor
            ) {

                return (
                    acumulado +
                    convertirNumero(valor)
                );

            },
            0
        );

    }


    // =====================================================
    // TOTAL CUMPLEN POR TÉCNICO
    // =====================================================

    function obtenerTotalCumplenTecnico(
        tecnico
    ) {

        if (
            !tecnico
        ) {

            return 0;

        }


        if (
            tecnico.total_cumplen !== undefined &&
            tecnico.total_cumplen !== null
        ) {

            return convertirNumero(
                tecnico.total_cumplen
            );

        }


        if (
            !tecnico.cumplen
        ) {

            return 0;

        }


        return Object.values(
            tecnico.cumplen
        ).reduce(
            function (
                acumulado,
                valor
            ) {

                return (
                    acumulado +
                    convertirNumero(valor)
                );

            },
            0
        );

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
                texto.replace(
                    ",",
                    "."
                );

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
            String(fecha).split("-");


        if (
            partes.length !== 3
        ) {

            return escapeHtml(
                fecha
            );

        }


        return `
            ${escapeHtml(partes[2])}/${escapeHtml(partes[1])}
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


        return String(fechaA).localeCompare(
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