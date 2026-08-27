document.addEventListener("DOMContentLoaded", function () {

    const elementoDatos = document.getElementById(
        "datos-Resultado-Auditorias-Digitador"
    );

    const tabla = document.getElementById(
        "tablaResultadoAuditoriasDigitador"
    );


    if (!elementoDatos || !tabla) {
        return;
    }


    let datos = [];


    try {

        datos = JSON.parse(
            elementoDatos.textContent
        );

    } catch (error) {

        console.error(
            "Error leyendo datos de auditorías por digitador:",
            error
        );

        return;
    }


    // =========================================================
    // ORDENAR POR % NO CUMPLE
    // MAYOR -> MENOR
    // =========================================================

    datos.sort(function (a, b) {

        return (
            Number(
                b.porcentaje_no_cumple || 0
            )
            -
            Number(
                a.porcentaje_no_cumple || 0
            )
        );

    });


    // =========================================================
    // LIMPIAR
    // =========================================================

    tabla.innerHTML = "";


    // =========================================================
    // SIN DATOS
    // =========================================================

    if (!datos.length) {

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td
                colspan="6"
                class="sin-datos"
            >
                No existen auditorías para los filtros seleccionados.
            </td>
        `;

        tabla.appendChild(fila);

        return;
    }


    // =========================================================
    // CREAR FILAS
    // =========================================================

    datos.forEach(function (item) {

        const fila = document.createElement("tr");


        const digitador =
            item.digitador || "Sin digitador";


        const tecnicos =
            Number(
                item.tecnicos_auditados || 0
            );


        const auditorias =
            Number(
                item.auditorias_realizadas || 0
            );


        const porcentaje =
            Number(
                item.porcentaje_no_cumple || 0
            );


        const noCumplen =
            Number(
                item.no_cumplen || 0
            );


        const cumplen =
            Number(
                item.cumplen || 0
            );


        fila.innerHTML = `

            <td>
                ${escapeHtml(digitador)}
            </td>

            <td>
                ${tecnicos}
            </td>

            <td>
                ${auditorias}
            </td>

            <td class="porcentaje-no-cumple">
                ${porcentaje.toFixed(2)}%
            </td>

            <td class="valor-no-cumple">
                ${noCumplen}
            </td>

            <td class="valor-cumple">
                ${cumplen}
            </td>

        `;


        tabla.appendChild(fila);

    });

});


// ============================================================
// SEGURIDAD HTML
// ============================================================

function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}
