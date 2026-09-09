document.addEventListener("DOMContentLoaded", function () {

    "use strict";
    /* =========================================================
       CONFIGURACIÓN
       ========================================================= */

    const UMBRAL_REAUDITAR = 65;


    /* =========================================================
       OBTENER NÚMERO
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

        let texto = String(valor)
            .trim()
            .replace("%", "")
            .replace(/\s/g, "");

        if (
            texto.includes(".") &&
            texto.includes(",")
        ) {

            texto = texto
                .replace(/\./g, "")
                .replace(",", ".");
        }

        else if (
            texto.includes(",")
        ) {

            texto = texto.replace(",", ".");
        }

        const numero = Number(texto);

        return Number.isFinite(numero)
            ? numero
            : 0;
    }


    /* =========================================================
       ESCAPE HTML
       ========================================================= */

    function escapeHtml(texto) {

        const div =
            document.createElement("div");

        div.textContent =
            texto === null ||
            texto === undefined
                ? ""
                : String(texto);

        return div.innerHTML;
    }


    /* =========================================================
       LEER RESULTADO_AUDITORIAS_TECNICO
       ========================================================= */

    function obtenerDatos() {

        /*
         * PRIMERO:
         * utilizar la variable global que ya creó
         * estadisticas.js
         */

        if (
            Array.isArray(
                window.Resultado_Auditorias_Tecnico
            )
        ) {



            return window.Resultado_Auditorias_Tecnico;
        }


        /*
         * SEGUNDO:
         * leer json_script directamente
         */

        const elemento =
            document.getElementById(
                "datos-Resultado-Auditorias-Tecnico"
            );


        if (!elemento) {


            return [];
        }


        const contenido =
            elemento.textContent.trim();


        if (!contenido) {


            return [];
        }


        try {

            let datos =
                JSON.parse(contenido);


            if (
                !Array.isArray(datos) &&
                datos &&
                Array.isArray(datos.data)
            ) {

                datos = datos.data;
            }


            if (
                !Array.isArray(datos) &&
                datos &&
                Array.isArray(datos.resultado)
            ) {

                datos = datos.resultado;
            }


            if (
                !Array.isArray(datos) &&
                datos &&
                Array.isArray(datos.datos)
            ) {

                datos = datos.datos;
            }


            if (!Array.isArray(datos)) {


                return [];
            }


            window.Resultado_Auditorias_Tecnico =
                datos;


            return datos;

        } catch (error) {

            return [];
        }
    }


    /* =========================================================
       TOTAL DE AUDITORÍAS
       ========================================================= */

    function obtenerTotalAuditorias(item) {

        return obtenerNumero(
            item.total ??
            item.total_auditorias ??
            item.numero_auditorias ??
            item.auditorias ??
            0
        );
    }


    /* =========================================================
       NO CUMPLE
       ========================================================= */

    function obtenerNoCumple(item) {

        return obtenerNumero(
            item.no_cumple ??
            item.noCumple ??
            item.total_no_cumple ??
            item.totalNoCumple ??
            0
        );
    }


    /* =========================================================
       CUMPLE
       ========================================================= */

    function obtenerCumple(item) {

        return obtenerNumero(
            item.cumple ??
            item.total_cumple ??
            item.totalCumple ??
            0
        );
    }


    /* =========================================================
       PORCENTAJE DE ERROR
       ========================================================= */

    function obtenerPorcentajeError(item) {

        /*
         * Si Django ya envió porcentaje_error,
         * utilizarlo directamente.
         */

        if (
            item.porcentaje_error !== undefined &&
            item.porcentaje_error !== null &&
            item.porcentaje_error !== ""
        ) {

            return obtenerNumero(
                item.porcentaje_error
            );
        }


        if (
            item.porcentajeError !== undefined &&
            item.porcentajeError !== null &&
            item.porcentajeError !== ""
        ) {

            return obtenerNumero(
                item.porcentajeError
            );
        }


        /*
         * Si no viene porcentaje,
         * calcularlo.
         */

        const total =
            obtenerTotalAuditorias(item);

        const noCumple =
            obtenerNoCumple(item);


        if (total <= 0) {
            return 0;
        }


        return (
            noCumple / total
        ) * 100;
    }


    /* =========================================================
       SABER SI TIENE AUDITORÍAS
       ========================================================= */

    function tieneAuditorias(item) {

        const total =
            obtenerTotalAuditorias(item);

        /*
         * LA REGLA PRINCIPAL ES:
         *
         * total > 0
         *
         * Porque Resultado_Auditorias_Tecnico
         * ya viene comparado desde Django.
         */

        return total > 0;
    }


    /* =========================================================
       CLASIFICAR TÉCNICO
       ========================================================= */

    function clasificarTecnico(item) {

        const total =
            obtenerTotalAuditorias(item);

        const porcentajeError =
            obtenerPorcentajeError(item);


        /*
         * ================================================
         * 1. NO TIENE AUDITORÍAS
         * ================================================
         */

        if (total === 0) {

            return {

                tipo: "sin_auditoria",

                estado: "Sin auditoría",

                accion: "Auditar",

                requiereAuditar: true,

                requiereReauditar: false
            };
        }


        /*
         * ================================================
         * 2. TIENE AUDITORÍAS Y ERROR >= 65%
         * ================================================
         */

        if (
            porcentajeError >=
            UMBRAL_REAUDITAR
        ) {

            return {

                tipo: "reauditar",

                estado: "Re-auditar",

                accion: "Volver a auditar",

                requiereAuditar: false,

                requiereReauditar: true
            };
        }


        /*
         * ================================================
         * 3. TIENE AUDITORÍAS Y ERROR < 65%
         * ================================================
         */

        return {

            tipo: "al_dia",

            estado: "Al día",

            accion: "Continuar seguimiento",

            requiereAuditar: false,

            requiereReauditar: false
        };
    }


    /* =========================================================
       SUPERVISOR
       ========================================================= */

    function obtenerSupervisor(item) {

        return (
            item.supervisor ||
            item.Supervisor ||
            ""
        );
    }


    /* =========================================================
       TÉCNICO
       ========================================================= */

    function obtenerNombreTecnico(item) {

        return (
            item.tecnico ||
            item.nombre_tecnico ||
            item.nombreTecnico ||
            item.nombre ||
            "Sin nombre"
        );
    }


    /* =========================================================
       CÉDULA
       ========================================================= */

    function obtenerCedula(item) {

        return (
            item.cedula ||
            item.numero_cedula ||
            item.numeroCedula ||
            ""
        );
    }


    /* =========================================================
       RESUMEN
       ========================================================= */

    function renderizarResumen(datos) {

        const total =
            datos.length;


        const auditados =
            datos.filter(
                tieneAuditorias
            ).length;


        const sinAuditoria =
            datos.filter(
                function (item) {

                    return (
                        obtenerTotalAuditorias(item)
                        === 0
                    );
                }
            ).length;


        const reauditar =
            datos.filter(
                function (item) {

                    const total =
                        obtenerTotalAuditorias(item);

                    const error =
                        obtenerPorcentajeError(item);

                    return (
                        total > 0 &&
                        error >= UMBRAL_REAUDITAR
                    );
                }
            ).length;


        const alDia =
            datos.filter(
                function (item) {

                    const total =
                        obtenerTotalAuditorias(item);

                    const error =
                        obtenerPorcentajeError(item);

                    return (
                        total > 0 &&
                        error < UMBRAL_REAUDITAR
                    );
                }
            ).length;


        const porcentajeAuditados =
            total > 0
                ? (auditados / total) * 100
                : 0;


        const porcentajeSinAuditar =
            total > 0
                ? (sinAuditoria / total) * 100
                : 0;


        const porcentajeReauditar =
            total > 0
                ? (reauditar / total) * 100
                : 0;


        const porcentajeAlDia =
            total > 0
                ? (alDia / total) * 100
                : 0;


        /*
         * TÉCNICOS CONTRATADOS
         */

        const elementoTotal =
            document.getElementById(
                "resumenTotalTecnicos"
            );

        if (elementoTotal) {

            elementoTotal.textContent =
                total.toLocaleString("es-CO");
        }


        /*
         * AUDITADOS
         */

        const elementoAuditados =
            document.getElementById(
                "resumenAuditados"
            );

        if (elementoAuditados) {

            elementoAuditados.textContent =
                auditados.toLocaleString("es-CO");
        }


        /*
         * % AUDITADOS
         */

        const elementoPorcentajeAuditados =
            document.getElementById(
                "resumenPorcentajeAuditados"
            );

        if (elementoPorcentajeAuditados) {

            elementoPorcentajeAuditados.textContent =
                porcentajeAuditados
                    .toFixed(2)
                    .replace(/\.00$/, "") +
                "%";
        }


        /*
         * SIN AUDITORÍA
         */

        const elementoSinAuditar =
            document.getElementById(
                "resumenSinAuditar"
            );

        if (elementoSinAuditar) {

            elementoSinAuditar.textContent =
                sinAuditoria.toLocaleString("es-CO");
        }


        /*
         * % SIN AUDITAR
         */

        const elementoPorcentajeSinAuditar =
            document.getElementById(
                "resumenPorcentajeSinAuditar"
            );

        if (elementoPorcentajeSinAuditar) {

            elementoPorcentajeSinAuditar.textContent =
                porcentajeSinAuditar
                    .toFixed(2)
                    .replace(/\.00$/, "") +
                "%";
        }


        /*
         * RE-AUDITAR
         */

        const elementoReauditar =
            document.getElementById(
                "resumenParaReauditar"
            );

        if (elementoReauditar) {

            elementoReauditar.textContent =
                reauditar.toLocaleString("es-CO");
        }


        /*
         * % RE-AUDITAR
         */

        const elementoPorcentajeReauditar =
            document.getElementById(
                "resumenPorcentajeReauditar"
            );

        if (elementoPorcentajeReauditar) {

            elementoPorcentajeReauditar.textContent =
                porcentajeReauditar
                    .toFixed(2)
                    .replace(/\.00$/, "") +
                "%";
        }


        /*
         * AL DÍA
         */

        const elementoAlDia =
            document.getElementById(
                "resumenAlDia"
            );

        if (elementoAlDia) {

            elementoAlDia.textContent =
                alDia.toLocaleString("es-CO");
        }


        /*
         * % AL DÍA
         */

        const elementoPorcentajeAlDia =
            document.getElementById(
                "resumenPorcentajeAlDia"
            );

        if (elementoPorcentajeAlDia) {

            elementoPorcentajeAlDia.textContent =
                porcentajeAlDia
                    .toFixed(2)
                    .replace(/\.00$/, "") +
                "%";
        }


        return {

            total,
            auditados,
            sinAuditoria,
            reauditar,
            alDia,

            porcentajeAuditados,
            porcentajeSinAuditar,
            porcentajeReauditar,
            porcentajeAlDia
        };
    }


    /* =========================================================
       TABLA: TÉCNICOS SIN AUDITORÍA
       ========================================================= */

    function renderizarSinAuditar(datos) {

        const tbody =
            document.getElementById(
                "tablaSinAuditarBody"
            );


        const contador =
            document.getElementById(
                "contadorTablaSinAuditar"
            );


        if (!tbody) {
            return;
        }


        const tecnicosSinAuditoria =
            datos.filter(
                function (item) {

                    return (
                        obtenerTotalAuditorias(item)
                        === 0
                    );
                }
            );


        tecnicosSinAuditoria.sort(
            function (a, b) {

                const supervisorA =
                    obtenerSupervisor(a);

                const supervisorB =
                    obtenerSupervisor(b);

                return supervisorA.localeCompare(
                    supervisorB,
                    "es"
                );
            }
        );


        tbody.innerHTML = "";


        if (
            tecnicosSinAuditoria.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="5"
                        class="tabla-vacia">
                        No ahi tecnicos para auditar
                    </td>
                </tr>
            `;

        } else {

            tecnicosSinAuditoria.forEach(
                function (item) {

                    const supervisor =
                        obtenerSupervisor(item);

                    const tecnico =
                        obtenerNombreTecnico(item);

                    const cedula =
                        obtenerCedula(item);


                    tbody.innerHTML += `
                        <tr>

                            <td>
                                ${escapeHtml(supervisor)}
                            </td>

                            <td>
                                ${escapeHtml(tecnico)}
                            </td>

                            <td>
                                ${escapeHtml(cedula)}
                            </td>

                            <td>
                                <span class="estado-sin-auditorias">
                                    Sin auditoría
                                </span>
                            </td>

                            <td>
                                <span class="accion-auditar">
                                    Auditar
                                </span>
                            </td>

                        </tr>
                    `;
                }
            );
        }


        if (contador) {

            contador.textContent =
                tecnicosSinAuditoria.length;
        }

    }


    /* =========================================================
       TABLA: TÉCNICOS PARA RE-AUDITAR
       ========================================================= */

    function renderizarReauditar(datos) {

        const tbody =
            document.getElementById(
                "tablaReauditarBody"
            );


        const contador =
            document.getElementById(
                "contadorTablaReauditar"
            );


        if (!tbody) {
            return;
        }


        const tecnicosReauditar =
            datos.filter(
                function (item) {

                    const total =
                        obtenerTotalAuditorias(item);

                    const porcentaje =
                        obtenerPorcentajeError(item);

                    /*
                     * IMPORTANTE:
                     *
                     * total > 0
                     *
                     * evita que un técnico sin auditorías
                     * aparezca como re-auditar.
                     */

                    return (
                        total > 0 &&
                        porcentaje >=
                        UMBRAL_REAUDITAR
                    );
                }
            );


        /*
         * MAYOR % DE ERROR PRIMERO
         */

        tecnicosReauditar.sort(
            function (a, b) {

                return (
                    obtenerPorcentajeError(b) -
                    obtenerPorcentajeError(a)
                );
            }
        );


        tbody.innerHTML = "";


        if (
            tecnicosReauditar.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8"
                        class="tabla-vacia">
                        No hay técnicos para
                        re-auditar.
                    </td>
                </tr>
            `;

        } else {

            tecnicosReauditar.forEach(
                function (item) {

                    const supervisor =
                        obtenerSupervisor(item);

                    const tecnico =
                        obtenerNombreTecnico(item);

                    const cedula =
                        obtenerCedula(item);

                    const total =
                        obtenerTotalAuditorias(item);

                    const noCumple =
                        obtenerNoCumple(item);

                    const cumple =
                        obtenerCumple(item);

                    const porcentaje =
                        obtenerPorcentajeError(item);


                    tbody.innerHTML += `
                        <tr>

                            <td>
                                ${escapeHtml(supervisor)}
                            </td>

                            <td>
                                ${escapeHtml(tecnico)}
                            </td>

                            <td>
                                ${escapeHtml(cedula)}
                            </td>

                            <td>
                                ${total.toLocaleString("es-CO")}
                            </td>

                            <td class="error-alto">
                                ${porcentaje
                                    .toFixed(2)
                                    .replace(/\.00$/, "")}%
                            </td>

                            <td class="no-cumple">
                                ${noCumple.toLocaleString("es-CO")}
                            </td>

                            <td class="cumple">
                                ${cumple.toLocaleString("es-CO")}
                            </td>

                            <td>
                                <span class="accion-reauditar">
                                    Volver a auditar
                                </span>
                            </td>

                        </tr>
                    `;
                }
            );
        }


        if (contador) {

            contador.textContent =
                tecnicosReauditar.length;
        }

    }


    /* =========================================================
       ACTUALIZAR TODO EL PANEL
       ========================================================= */

    function actualizarPanel() {

        const datos =
            obtenerDatos();


        if (!Array.isArray(datos)) {

            return;
        }

        /*
         * Mostrar primer registro para comprobar
         */

        if (datos.length > 0) {

        }


        /*
         * Clasificar cada técnico
         */

        datos.forEach(
            function (item) {

                const clasificacion =
                    clasificarTecnico(item);

            }
        );


        /*
         * RESUMEN
         */

        renderizarResumen(datos);


        /*
         * TABLA PARA AUDITAR
         */

        renderizarSinAuditar(datos);


        /*
         * TABLA PARA RE-AUDITAR
         */

        renderizarReauditar(datos);

    }


    /* =========================================================
       FUNCIÓN GLOBAL
       ========================================================= */

    window.actualizarPanelTecnicosPendientes =
        actualizarPanel;


    /* =========================================================
       ESCUCHAR ACTUALIZACIÓN DE ESTADÍSTICAS
       ========================================================= */

    window.addEventListener(
        "ResultadoAuditoriasTecnicoActualizado",
        function (event) {
            if (
                event.detail &&
                Array.isArray(event.detail)
            ) {

                window.Resultado_Auditorias_Tecnico =
                    event.detail;
            }


            actualizarPanel();
        }
    );


    /* =========================================================
       INICIALIZAR
       ========================================================= */

    actualizarPanel();


});