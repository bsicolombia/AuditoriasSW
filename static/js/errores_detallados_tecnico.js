document.addEventListener("DOMContentLoaded", function () {

    console.log("======================================");
    console.log("TABLA ERRORES DETALLADOS POR TÉCNICO");
    console.log("======================================");

    const elementoDatos = document.getElementById(
        "datos-Errores-Detallados-Tecnico"
    );

    if (!elementoDatos) {

        console.error(
            "❌ NO existe #datos-Errores-Detallados-Tecnico"
        );

        return;
    }

    console.log(
        "✅ Elemento JSON encontrado"
    );

    console.log(
        "JSON recibido:",
        elementoDatos.textContent
    );

    let datos;

    try {

        datos = JSON.parse(
            elementoDatos.textContent
        );

    } catch (error) {

        console.error(
            "❌ Error haciendo JSON.parse:",
            error
        );

        return;
    }

    console.log(
        "Datos convertidos:",
        datos
    );

    console.log(
        "Cantidad de técnicos:",
        datos.length
    );


    // =====================================================
    // TABLA
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


    if (!thead || !tbody || !tfoot) {

        console.error(
            "❌ No se encontraron las partes de la tabla"
        );

        console.error({
            thead,
            tbody,
            tfoot
        });

        return;
    }


    // =====================================================
    // LIMPIAR
    // =====================================================

    thead.innerHTML = "";
    tbody.innerHTML = "";
    tfoot.innerHTML = "";


    // =====================================================
    // SIN DATOS
    // =====================================================

    if (!Array.isArray(datos) || datos.length === 0) {

        console.warn(
            "⚠️ Django está enviando un arreglo vacío []"
        );

        const fila = document.createElement("tr");

        const celda = document.createElement("td");

        celda.colSpan = 2;

        celda.textContent =
            "No hay errores registrados para los filtros seleccionados.";

        celda.classList.add(
            "tabla-sin-datos"
        );

        fila.appendChild(celda);

        tbody.appendChild(fila);

        return;
    }


    // =====================================================
    // OBTENER HALLAZGOS
    // =====================================================

    const hallazgosSet = new Set();

    datos.forEach(function (tecnico) {

        if (!Array.isArray(tecnico.hallazgos)) {
            return;
        }

        tecnico.hallazgos.forEach(function (item) {

            const nombre = String(
                item.hallazgo || ""
            ).trim();

            if (nombre) {
                hallazgosSet.add(nombre);
            }

        });

    });


    const hallazgos = Array.from(
        hallazgosSet
    );

    hallazgos.sort(function (a, b) {

        return a.localeCompare(
            b,
            "es",
            {
                sensitivity: "base"
            }
        );

    });


    console.log(
        "Hallazgos encontrados:",
        hallazgos
    );


    // =====================================================
    // ENCABEZADO
    // =====================================================

    const filaHead = document.createElement("tr");


    const thTecnico = document.createElement("th");

    thTecnico.textContent = "Técnico";

    filaHead.appendChild(thTecnico);


    hallazgos.forEach(function (hallazgo) {

        const th = document.createElement("th");

        th.textContent = hallazgo;

        th.title = hallazgo;

        filaHead.appendChild(th);

    });


    const thTotal = document.createElement("th");

    thTotal.textContent = "Total";

    filaHead.appendChild(thTotal);


    thead.appendChild(filaHead);


    // =====================================================
    // TOTALES
    // =====================================================

    const totales = {};

    hallazgos.forEach(function (hallazgo) {

        totales[hallazgo] = 0;

    });

    let totalGeneral = 0;


    // =====================================================
    // FILAS
    // =====================================================

    datos.forEach(function (tecnico) {

        const fila = document.createElement("tr");


        // -------------------------------------------------
        // TÉCNICO
        // -------------------------------------------------

        const celdaTecnico =
            document.createElement("td");

        celdaTecnico.textContent =
            tecnico.tecnico || "Sin técnico";

        celdaTecnico.classList.add(
            "nombre-tecnico"
        );

        fila.appendChild(
            celdaTecnico
        );


        // -------------------------------------------------
        // MAPA DE HALLAZGOS
        // -------------------------------------------------

        const erroresTecnico = {};


        if (Array.isArray(tecnico.hallazgos)) {

            tecnico.hallazgos.forEach(
                function (item) {

                    const nombre =
                        String(
                            item.hallazgo || ""
                        ).trim();

                    const cantidad =
                        Number(
                            item.cantidad || 0
                        );

                    if (nombre) {

                        erroresTecnico[nombre] =
                            cantidad;

                    }

                }
            );

        }


        // -------------------------------------------------
        // COLUMNAS
        // -------------------------------------------------

        hallazgos.forEach(function (hallazgo) {

            const celda =
                document.createElement("td");

            const cantidad =
                Number(
                    erroresTecnico[hallazgo] || 0
                );


            if (cantidad > 0) {

                celda.textContent =
                    cantidad;

                celda.classList.add(
                    "celda-error"
                );

                totales[hallazgo] += cantidad;

                totalGeneral += cantidad;

            } else {

                celda.textContent = "";

            }


            fila.appendChild(celda);

        });


        // -------------------------------------------------
        // TOTAL TÉCNICO
        // -------------------------------------------------

        const celdaTotal =
            document.createElement("td");

        celdaTotal.textContent =
            Number(tecnico.total || 0);

        celdaTotal.classList.add(
            "celda-total"
        );

        fila.appendChild(
            celdaTotal
        );


        tbody.appendChild(
            fila
        );

    });


    // =====================================================
    // PIE DE TABLA
    // =====================================================

    const filaTotal =
        document.createElement("tr");

    filaTotal.classList.add(
        "fila-total"
    );


    const celdaNombreTotal =
        document.createElement("td");

    celdaNombreTotal.textContent =
        "TOTAL";

    celdaNombreTotal.classList.add(
        "nombre-total"
    );

    filaTotal.appendChild(
        celdaNombreTotal
    );


    hallazgos.forEach(function (hallazgo) {

        const celda =
            document.createElement("td");

        celda.textContent =
            totales[hallazgo] || 0;

        filaTotal.appendChild(
            celda
        );

    });


    const celdaTotalGeneral =
        document.createElement("td");

    celdaTotalGeneral.textContent =
        totalGeneral;

    celdaTotalGeneral.classList.add(
        "celda-total-general"
    );

    filaTotal.appendChild(
        celdaTotalGeneral
    );


    tfoot.appendChild(
        filaTotal
    );


    console.log(
        "======================================"
    );

    console.log(
        "✅ TABLA CREADA CORRECTAMENTE"
    );

    console.log(
        "======================================"

    );

});
