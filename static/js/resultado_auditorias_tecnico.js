document.addEventListener("DOMContentLoaded", function () {

    const elementoDatos = document.getElementById(
        "datos-Resultado-Auditorias-Tecnico"
    );

    const tabla = document.getElementById(
        "tablaResultadoAuditoriasTecnico"
    );

    const btnVerTodos = document.getElementById(
        "btnVerTodosTecnicos"
    );

    const btnVerSinAuditorias = document.getElementById(
        "btnVerSinAuditorias"
    );

    const contadorSinAuditorias = document.getElementById(
        "contadorSinAuditorias"
    );


    if (!elementoDatos || !tabla) {
        return;
    }


    // =========================================================
    // LEER DATOS DJANGO
    // =========================================================

    let datos = [];

    try {

        datos = JSON.parse(
            elementoDatos.textContent
        );

    } catch (error) {

        console.error(
            "Error leyendo datos de auditorías por técnico:",
            error
        );

        return;
    }


    // =========================================================
    // CONTAR TÉCNICOS SIN AUDITORÍAS
    // =========================================================

    const tecnicosSinAuditorias = datos.filter(
        function (item) {

            return item.tiene_auditorias === false;

        }
    );


    if (contadorSinAuditorias) {

        contadorSinAuditorias.textContent =
            tecnicosSinAuditorias.length;

    }


    // =========================================================
    // RENDERIZAR TABLA
    // =========================================================

    function renderizarTabla(modo) {

        tabla.innerHTML = "";


        let datosMostrar = datos;


        // -----------------------------------------------------
        // SOLO SIN AUDITORÍAS
        // -----------------------------------------------------

        if (modo === "sin_auditorias") {

            datosMostrar = datos.filter(
                function (item) {

                    return item.tiene_auditorias === false;

                }
            );

        }


        // =====================================================
        // ORDENAR
        // =====================================================

        datosMostrar.sort(function (a, b) {

            // Primero los que sí tienen auditorías
            if (
                a.tiene_auditorias !==
                b.tiene_auditorias
            ) {

                return a.tiene_auditorias
                    ? -1
                    : 1;

            }


            // Después porcentaje de error
            const errorA = Number(
                a.porcentaje_error || 0
            );

            const errorB = Number(
                b.porcentaje_error || 0
            );


            if (errorA !== errorB) {

                return errorB - errorA;

            }


            // Finalmente por nombre
            return String(
                a.tecnico || ""
            ).localeCompare(
                String(
                    b.tecnico || ""
                )
            );

        });


        // =====================================================
        // SIN DATOS
        // =====================================================

        if (!datosMostrar.length) {

            const fila =
                document.createElement("tr");


            fila.innerHTML = `
                <td
                    colspan="6"
                    class="sin-datos"
                >
                    No existen técnicos sin auditorías
                    para los filtros seleccionados.
                </td>
            `;


            tabla.appendChild(fila);

            return;
        }


        // =====================================================
        // CREAR FILAS
        // =====================================================

        datosMostrar.forEach(function (item) {

            const fila =
                document.createElement("tr");


            const tecnico =
                item.tecnico ||
                "Sin técnico";


            // =================================================
            // TÉCNICO CON AUDITORÍAS
            // =================================================

            if (item.tiene_auditorias === true) {

                const total =
                    Number(item.total || 0);

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
                        ${escapeHtml(tecnico)}
                    </td>

                    <td>
                        ${total}
                    </td>

                    <td class="porcentaje-error">
                        ${porcentajeError.toFixed(2)}%
                    </td>

                    <td class="valor-no-cumple">
                        ${noCumple}
                    </td>

                    <td class="valor-cumple">
                        ${cumple}
                    </td>

                    <td>
                        ${diasAuditados}
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
                        ${escapeHtml(tecnico)}
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


            tabla.appendChild(fila);

        });


        // =====================================================
        // EVENTOS DE LOS N/A
        // =====================================================

        document
            .querySelectorAll(".btn-na")
            .forEach(function (boton) {

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

            });

    }


    // =========================================================
    // ACTIVAR BOTÓN
    // =========================================================

    function activarBoton(botonActivo) {

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
    // VISTA INICIAL
    // =========================================================

    renderizarTabla(
        "todos"
    );

});


// ============================================================
// SEGURIDAD HTML
// ============================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}
