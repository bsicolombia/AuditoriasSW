document.addEventListener("DOMContentLoaded", function () {

    const elementoDatos = document.getElementById(
        "datos-Errores-Detallados-Tecnico"
    );

    if (!elementoDatos) {
        return;
    }


    // =====================================================
    // PARSEAR DATOS
    // =====================================================

    let datos;

    try {

        datos = JSON.parse(
            elementoDatos.textContent
        );

    } catch (error) {

        console.error(
            "Error leyendo los datos:",
            error
        );

        return;
    }


    if (!Array.isArray(datos)) {
        return;
    }


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const thead = document.getElementById(
        "tablaErroresTecnicoHead"
    );

    const tbody = document.getElementById(
        "tablaErroresTecnicoBody"
    );

    const tfoot = document.getElementById(
        "tablaErroresTecnicoFoot"
    );


    if (!thead || !tbody) {
        return;
    }


    // =====================================================
    // GUARDAR ORDEN ORIGINAL DE LOS TÉCNICOS
    // =====================================================

    const datosOriginales = datos.map(
        function (tecnico, indice) {

            return {
                dato: tecnico,
                indiceOriginal: indice
            };

        }
    );


    // =====================================================
    // OBTENER HALLAZGOS
    // =====================================================

    const hallazgosSet = new Set();


    datosOriginales.forEach(
        function (registro) {

            const tecnico = registro.dato;


            if (!Array.isArray(tecnico.hallazgos)) {
                return;
            }


            tecnico.hallazgos.forEach(
                function (item) {

                    const nombre = String(
                        item.hallazgo || ""
                    ).trim();


                    if (nombre) {
                        hallazgosSet.add(nombre);
                    }

                }
            );

        }
    );


    // =====================================================
    // FUNCIÓN PARA OBTENER EL NÚMERO DEL HALLAZGO
    //
    // Ejemplos:
    //
    // "1.Medida Erróneo"              → 1
    // "2.Registro fotográfico"        → 2
    // "10.Registro fotográfico..."    → 10
    // "16.Diligenciamiento..."        → 16
    //
    // =====================================================

    function obtenerNumeroHallazgo(
        hallazgo
    ) {

        const texto =
            String(hallazgo || "").trim();


        const coincidencia =
            texto.match(/^\s*(\d+)/);


        if (!coincidencia) {
            return Number.MAX_SAFE_INTEGER;
        }


        const numero =
            Number(coincidencia[1]);


        return Number.isFinite(numero)
            ? numero
            : Number.MAX_SAFE_INTEGER;

    }


    // =====================================================
    // ORDEN ORIGINAL DE LOS HALLAZGOS
    //
    // IMPORTANTE:
    //
    // El orden inicial será:
    //
    // 1
    // 2
    // 3
    // 4
    // ...
    // 10
    // 11
    // 12
    //
    // Y NO:
    //
    // 1
    // 10
    // 11
    // 12
    // 2
    //
    // =====================================================

    const hallazgosOriginales =
        Array.from(hallazgosSet);


    // =====================================================
    // ORDEN INICIAL DE LOS HALLAZGOS POR NÚMERO
    //
    // Ejemplo:
    //
    // 1.Medidor
    // 2.Fugas
    // 3.Calidad
    // 3.Foto acrílica
    // 4.Stampa
    // 5.Foto fachada
    // 5.Lectura errónea
    // 6.Anomalía
    // ...
    // 17.Registro
    //
    // =====================================================

    hallazgosOriginales.sort(
        function (a, b) {

            const numeroA =
                obtenerNumeroHallazgo(a);

            const numeroB =
                obtenerNumeroHallazgo(b);


            // ---------------------------------------------
            // ORDENAR POR NÚMERO
            // ---------------------------------------------

            if (
                numeroA !== numeroB
            ) {

                return numeroA - numeroB;

            }


            // ---------------------------------------------
            // SI TIENEN EL MISMO NÚMERO
            //
            // Se conserva el orden en que aparecieron.
            // ---------------------------------------------

            return 0;

        }
    );


    // =====================================================
    // HALLAZGOS QUE SE MOSTRARÁN ACTUALMENTE
    // =====================================================

    let hallazgos =
        hallazgosOriginales.slice();


    // =====================================================
    // ESTADO DEL ORDEN DE LOS TÉCNICOS
    //
    // null       = orden original
    // "total"    = total del técnico
    // hallazgo   = cantidad de ese hallazgo
    //
    // desc       = mayor → menor
    // asc        = menor → mayor
    // =====================================================

    let ordenActual = {
        columna: null,
        direccion: null
    };


    // =====================================================
    // ESTADO DEL ORDEN DE LAS COLUMNAS
    //
    // null = orden normal 1,2,3,4...
    // desc = mayor → menor según TOTAL GENERAL
    // asc  = menor → mayor según TOTAL GENERAL
    // =====================================================

    let ordenColumnas = {
        direccion: null
    };


    // =====================================================
    // CANTIDAD POR HALLAZGO
    // =====================================================

    function obtenerCantidadHallazgo(
        tecnico,
        hallazgo
    ) {

        if (!Array.isArray(tecnico.hallazgos)) {
            return 0;
        }


        const item =
            tecnico.hallazgos.find(
                function (elemento) {

                    return String(
                        elemento.hallazgo || ""
                    ).trim() === hallazgo;

                }
            );


        if (!item) {
            return 0;
        }


        const cantidad =
            Number(item.cantidad);


        return Number.isFinite(cantidad)
            ? cantidad
            : 0;

    }


    // =====================================================
    // TOTAL DEL TÉCNICO
    // =====================================================

    function obtenerTotalTecnico(
        tecnico
    ) {

        const total =
            Number(tecnico.total);


        return Number.isFinite(total)
            ? total
            : 0;

    }


    // =====================================================
    // TOTAL DE HALLAZGOS DEL TÉCNICO
    //
    // Suma todas las cantidades de sus hallazgos.
    // =====================================================

    function obtenerTotalHallazgosTecnico(
        tecnico
    ) {

        if (!Array.isArray(tecnico.hallazgos)) {
            return 0;
        }


        let total = 0;


        tecnico.hallazgos.forEach(
            function (item) {

                const cantidad =
                    Number(item.cantidad);


                if (Number.isFinite(cantidad)) {

                    total += cantidad;

                }

            }
        );


        return total;

    }


    // =====================================================
    // CALCULAR TOTALES GENERALES
    //
    // IMPORTANTE:
    // Se calcula sobre todos los datos actuales.
    // =====================================================

    function calcularTotales() {

        const totales = {};


        hallazgosOriginales.forEach(
            function (hallazgo) {

                totales[hallazgo] = 0;

            }
        );


        let totalGeneral = 0;


        datosOriginales.forEach(
            function (registro) {

                const tecnico =
                    registro.dato;


                // -----------------------------------------
                // TOTAL POR CADA HALLAZGO
                // -----------------------------------------

                hallazgosOriginales.forEach(
                    function (hallazgo) {

                        const cantidad =
                            obtenerCantidadHallazgo(
                                tecnico,
                                hallazgo
                            );


                        totales[hallazgo] +=
                            cantidad;

                    }
                );


                // -----------------------------------------
                // TOTAL GENERAL
                // -----------------------------------------

                totalGeneral +=
                    obtenerTotalTecnico(
                        tecnico
                    );

            }
        );


        return {
            totales: totales,
            totalGeneral: totalGeneral
        };

    }


    // =====================================================
    // OBTENER HALLAZGOS ORDENADOS
    //
    // ESTA FUNCIÓN ORDENA LAS COLUMNAS.
    //
    // INICIALMENTE:
    //
    // 1, 2, 3, 4, 5...
    //
    // PRIMER CLIC:
    //
    // MAYOR → MENOR
    //
    // SEGUNDO CLIC:
    //
    // MENOR → MAYOR
    //
    // TERCER CLIC:
    //
    // VUELVE A 1,2,3,4...
    //
    // =====================================================

    function obtenerHallazgosOrdenados(
        totales
    ) {

        // =================================================
        // ORDEN NORMAL
        // =================================================

        if (
            ordenColumnas.direccion === null
        ) {

            return hallazgosOriginales.slice();

        }


        // =================================================
        // COPIA
        // =================================================

        const copia =
            hallazgosOriginales.slice();


        // =================================================
        // MAYOR → MENOR
        // =================================================

        if (
            ordenColumnas.direccion === "desc"
        ) {

            copia.sort(
                function (a, b) {

                    const totalA =
                        Number(totales[a] || 0);

                    const totalB =
                        Number(totales[b] || 0);


                    if (
                        totalA !== totalB
                    ) {

                        return totalB - totalA;

                    }


                    // Si empatan:
                    // conservar 1,2,3,4...

                    return (
                        obtenerNumeroHallazgo(a) -
                        obtenerNumeroHallazgo(b)
                    );

                }
            );

        }


        // =================================================
        // MENOR → MAYOR
        // =================================================

        else if (
            ordenColumnas.direccion === "asc"
        ) {

            copia.sort(
                function (a, b) {

                    const totalA =
                        Number(totales[a] || 0);

                    const totalB =
                        Number(totales[b] || 0);


                    if (
                        totalA !== totalB
                    ) {

                        return totalA - totalB;

                    }


                    // Si empatan:
                    // conservar 1,2,3,4...

                    return (
                        obtenerNumeroHallazgo(a) -
                        obtenerNumeroHallazgo(b)
                    );

                }
            );

        }


        return copia;

    }


    // =====================================================
    // ICONO DEL ORDEN DE COLUMNAS
    // =====================================================

    function obtenerIconoOrdenColumnas() {

        if (
            ordenColumnas.direccion === "desc"
        ) {

            return "↓";

        }


        if (
            ordenColumnas.direccion === "asc"
        ) {

            return "↑";

        }


        return "↕";

    }


    // =====================================================
    // CAMBIAR ORDEN DE COLUMNAS
    //
    // TOTAL GENERAL
    //
    // 1 clic → MAYOR → MENOR
    // 2 clic → MENOR → MAYOR
    // 3 clic → NORMAL 1,2,3,4...
    // =====================================================

    function cambiarOrdenColumnas() {

        // =================================================
        // PRIMER CLIC
        // =================================================

        if (
            ordenColumnas.direccion === null
        ) {

            ordenColumnas.direccion =
                "desc";

        }


        // =================================================
        // SEGUNDO CLIC
        // =================================================

        else if (
            ordenColumnas.direccion === "desc"
        ) {

            ordenColumnas.direccion =
                "asc";

        }


        // =================================================
        // TERCER CLIC
        // =================================================

        else {

            ordenColumnas.direccion =
                null;

        }


        renderizarTabla();

    }


    // =====================================================
    // ICONO DE ORDEN DE TÉCNICOS
    // =====================================================

    function obtenerIconoOrden(
        columna
    ) {

        if (
            ordenActual.columna !== columna
        ) {

            return "↕";

        }


        if (
            ordenActual.direccion === "desc"
        ) {

            return "↓";

        }


        if (
            ordenActual.direccion === "asc"
        ) {

            return "↑";

        }


        return "↕";

    }


    // =====================================================
    // CREAR BOTÓN DE ORDEN
    // =====================================================

    function crearBotonOrden(
        texto,
        columna,
        clase
    ) {

        const boton =
            document.createElement("button");


        boton.type =
            "button";


        boton.className =
            clase;


        boton.title =
            "Mayor → menor → menor → mayor → orden original";


        const spanTexto =
            document.createElement("span");


        spanTexto.className =
            "hallazgo-texto";


        spanTexto.textContent =
            texto;


        const spanIcono =
            document.createElement("span");


        spanIcono.className =
            "icono-orden";


        spanIcono.textContent =
            obtenerIconoOrden(
                columna
            );


        boton.appendChild(
            spanTexto
        );


        boton.appendChild(
            spanIcono
        );


        boton.addEventListener(
            "click",
            function () {

                cambiarOrden(
                    columna
                );

            }
        );


        return boton;

    }


    // =====================================================
    // CAMBIAR ORDEN DE TÉCNICOS
    //
    // 1 clic → MAYOR → MENOR
    // 2 clic → MENOR → MAYOR
    // 3 clic → ORIGINAL
    // =====================================================

    function cambiarOrden(
        columna
    ) {

        // =================================================
        // OTRA COLUMNA
        // =================================================

        if (
            ordenActual.columna !== columna
        ) {

            ordenActual.columna =
                columna;

            ordenActual.direccion =
                "desc";

        }


        // =================================================
        // DESC → ASC
        // =================================================

        else if (
            ordenActual.direccion === "desc"
        ) {

            ordenActual.direccion =
                "asc";

        }


        // =================================================
        // ASC → ORIGINAL
        // =================================================

        else if (
            ordenActual.direccion === "asc"
        ) {

            ordenActual.columna =
                null;

            ordenActual.direccion =
                null;

        }


        renderizarTabla();

    }


    // =====================================================
    // OBTENER TÉCNICOS ORDENADOS
    // =====================================================

    function obtenerDatosOrdenados() {

        // =================================================
        // ORDEN ORIGINAL
        // =================================================

        if (
            ordenActual.columna === null
        ) {

            return datosOriginales
                .slice()
                .sort(
                    function (a, b) {

                        return (
                            a.indiceOriginal -
                            b.indiceOriginal
                        );

                    }
                );

        }


        // =================================================
        // COPIA
        // =================================================

        const copia =
            datosOriginales.slice();


        copia.sort(
            function (
                registroA,
                registroB
            ) {

                const tecnicoA =
                    registroA.dato;

                const tecnicoB =
                    registroB.dato;


                let valorA = 0;
                let valorB = 0;


                // =================================================
                // TOTAL DEL TÉCNICO
                // =================================================

                if (
                    ordenActual.columna === "total"
                ) {

                    valorA =
                        obtenerTotalTecnico(
                            tecnicoA
                        );

                    valorB =
                        obtenerTotalTecnico(
                            tecnicoB
                        );

                }


                // =================================================
                // HALLAZGO INDIVIDUAL
                // =================================================

                else {

                    valorA =
                        obtenerCantidadHallazgo(
                            tecnicoA,
                            ordenActual.columna
                        );

                    valorB =
                        obtenerCantidadHallazgo(
                            tecnicoB,
                            ordenActual.columna
                        );

                }


                // =================================================
                // MAYOR → MENOR
                // =================================================

                if (
                    ordenActual.direccion === "desc"
                ) {

                    if (
                        valorA !== valorB
                    ) {

                        return valorB - valorA;

                    }

                }


                // =================================================
                // MENOR → MAYOR
                // =================================================

                if (
                    ordenActual.direccion === "asc"
                ) {

                    if (
                        valorA !== valorB
                    ) {

                        return valorA - valorB;

                    }

                }


                // =================================================
                // EMPATE
                // =================================================

                return (
                    registroA.indiceOriginal -
                    registroB.indiceOriginal
                );

            }
        );


        return copia;

    }


    // =====================================================
    // RENDERIZAR TABLA
    // =====================================================

    function renderizarTabla() {

        thead.innerHTML = "";
        tbody.innerHTML = "";


        if (tfoot) {
            tfoot.innerHTML = "";
        }


        // =================================================
        // SIN DATOS
        // =================================================

        if (
            datosOriginales.length === 0
        ) {

            const fila =
                document.createElement("tr");


            const celda =
                document.createElement("td");


            celda.colSpan =
                hallazgosOriginales.length + 2;


            celda.className =
                "tabla-sin-datos";


            celda.textContent =
                "No hay errores registrados para los filtros seleccionados.";


            fila.appendChild(
                celda
            );


            tbody.appendChild(
                fila
            );


            return;

        }


        // =================================================
        // CALCULAR TOTALES
        // =================================================

        const resultadoTotales =
            calcularTotales();


        const totales =
            resultadoTotales.totales;


        const totalGeneral =
            resultadoTotales.totalGeneral;


        // =================================================
        // OBTENER ORDEN ACTUAL DE LAS COLUMNAS
        // =================================================

        hallazgos =
            obtenerHallazgosOrdenados(
                totales
            );


        // =================================================
        // FILA DEL ENCABEZADO
        // =================================================

        const filaHead =
            document.createElement("tr");


        filaHead.className =
            "fila-encabezado";


        // =================================================
        // COLUMNA TÉCNICO
        // =================================================

        const thTecnico =
            document.createElement("th");


        thTecnico.className =
            "columna-tecnico";


        thTecnico.textContent =
            "Técnico";


        filaHead.appendChild(
            thTecnico
        );


        // =================================================
        // COLUMNAS DE HALLAZGOS
        // =================================================

        hallazgos.forEach(
            function (hallazgo) {

                const th =
                    document.createElement("th");


                th.title =
                    "Ordenar técnicos por " +
                    hallazgo;


                th.appendChild(
                    crearBotonOrden(
                        hallazgo,
                        hallazgo,
                        "boton-orden-hallazgo"
                    )
                );


                filaHead.appendChild(
                    th
                );

            }
        );


        // =================================================
        // COLUMNA TOTAL
        // =================================================

        const thTotal =
            document.createElement("th");


        thTotal.title =
            "Ordenar técnicos por Total";


        thTotal.appendChild(
            crearBotonOrden(
                "Total",
                "total",
                "boton-orden-total"
            )
        );


        filaHead.appendChild(
            thTotal
        );


        // =================================================
        // FILA TOTAL GENERAL
        // =================================================

        const filaTotal =
            document.createElement("tr");


        filaTotal.className =
            "fila-total-superior";


        // =================================================
        // CELDA TOTAL GENERAL
        // =================================================

        const thNombreTotal =
            document.createElement("th");


        thNombreTotal.className =
            "nombre-total-superior";


        // =================================================
        // BOTÓN TOTAL GENERAL
        //
        // ESTE BOTÓN ORDENA LAS COLUMNAS
        // SEGÚN LA CANTIDAD TOTAL DE ERRORES.
        // =================================================

        const botonTotalGeneral =
            document.createElement("button");


        botonTotalGeneral.type =
            "button";


        botonTotalGeneral.className =
            "boton-orden-total-general";


        botonTotalGeneral.title =
            "Ordenar hallazgos por cantidad total: mayor → menor → menor → mayor → orden normal";


        const spanTotalTexto =
            document.createElement("span");


        spanTotalTexto.className =
            "hallazgo-texto";


        spanTotalTexto.textContent =
            "TOTAL GENERAL";


        const spanTotalIcono =
            document.createElement("span");


        spanTotalIcono.className =
            "icono-orden";


        spanTotalIcono.textContent =
            obtenerIconoOrdenColumnas();


        botonTotalGeneral.appendChild(
            spanTotalTexto
        );


        botonTotalGeneral.appendChild(
            spanTotalIcono
        );


        botonTotalGeneral.addEventListener(
            "click",
            function () {

                cambiarOrdenColumnas();

            }
        );


        thNombreTotal.appendChild(
            botonTotalGeneral
        );


        filaTotal.appendChild(
            thNombreTotal
        );


        // =================================================
        // TOTALES DE CADA HALLAZGO
        //
        // IMPORTANTE:
        //
        // Se utiliza "hallazgos", NO
        // "hallazgosOriginales".
        //
        // De esta forma el número se mueve junto
        // con su hallazgo.
        // =================================================

        hallazgos.forEach(
            function (hallazgo) {

                const th =
                    document.createElement("th");


                th.className =
                    "celda-total-superior";


                th.textContent =
                    Number(
                        totales[hallazgo] || 0
                    ).toLocaleString(
                        "es-CO"
                    );


                filaTotal.appendChild(
                    th
                );

            }
        );


        // =================================================
        // TOTAL GENERAL NUMÉRICO
        // =================================================

        const thGeneral =
            document.createElement("th");


        thGeneral.className =
            "celda-total-general-superior";


        thGeneral.textContent =
            totalGeneral.toLocaleString(
                "es-CO"
            );


        filaTotal.appendChild(
            thGeneral
        );


        // =================================================
        // INSERTAR THEAD
        // =================================================

        thead.appendChild(
            filaHead
        );


        thead.appendChild(
            filaTotal
        );


        // =================================================
        // OBTENER TÉCNICOS ORDENADOS
        // =================================================

        const datosOrdenados =
            obtenerDatosOrdenados();


        // =================================================
        // CREAR FILAS DE TÉCNICOS
        // =================================================

        datosOrdenados.forEach(
            function (registro) {

                const tecnico =
                    registro.dato;


                const fila =
                    document.createElement("tr");


                // =================================================
                // TÉCNICO
                // =================================================

                const celdaTecnico =
                    document.createElement("td");


                celdaTecnico.className =
                    "nombre-tecnico";


                celdaTecnico.textContent =
                    tecnico.tecnico ||
                    "Sin técnico";


                celdaTecnico.title =
                    tecnico.tecnico ||
                    "Sin técnico";


                fila.appendChild(
                    celdaTecnico
                );


                // =================================================
                // HALLAZGOS
                //
                // SE UTILIZA EL MISMO ORDEN DE LAS COLUMNAS
                // =================================================

                hallazgos.forEach(
                    function (hallazgo) {

                        const celda =
                            document.createElement("td");


                        const cantidad =
                            obtenerCantidadHallazgo(
                                tecnico,
                                hallazgo
                            );


                        if (
                            cantidad > 0
                        ) {

                            celda.textContent =
                                cantidad.toLocaleString(
                                    "es-CO"
                                );


                            celda.classList.add(
                                "celda-error"
                            );

                        }

                        else {

                            celda.textContent =
                                "";

                        }


                        fila.appendChild(
                            celda
                        );

                    }
                );


                // =================================================
                // TOTAL DEL TÉCNICO
                // =================================================

                const celdaTotal =
                    document.createElement("td");


                celdaTotal.className =
                    "celda-total";


                celdaTotal.textContent =
                    obtenerTotalTecnico(
                        tecnico
                    ).toLocaleString(
                        "es-CO"
                    );


                fila.appendChild(
                    celdaTotal
                );


                tbody.appendChild(
                    fila
                );

            }
        );

    }


    // =====================================================
    // PRIMERA CARGA
    //
    // AUTOMÁTICAMENTE QUEDA:
    //
    // 1 → 2 → 3 → 4 → 5 → ...
    // =====================================================

    renderizarTabla();

});