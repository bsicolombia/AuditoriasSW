document.addEventListener("DOMContentLoaded", function () {

    "use strict";

    console.log(
        "=== PANEL TÉCNICOS SIN AUDITAR / PARA RE-AUDITAR INICIADO ==="
    );


    /* =========================================================
       REGLA DE NEGOCIO
       ========================================================= */

    const UMBRAL_REAUDITAR = 65;


    /* =========================================================
       ELEMENTOS DEL DOM
       ========================================================= */

    const cuerpoSinAuditar =
        document.getElementById(
            "tablaSinAuditarBody"
        );

    const cuerpoReauditar =
        document.getElementById(
            "tablaReauditarBody"
        );

    if (
        !cuerpoSinAuditar ||
        !cuerpoReauditar
    ) {

        console.warn(
            "⚠️ No se encontraron las tablas del panel de pendientes."
        );

        return;
    }


    /* =========================================================
       FUNCIONES AUXILIARES (mismo criterio que tus otros scripts)
       ========================================================= */

    function obtenerNumero(valor) {

        if (
            typeof window.obtenerNumero ===
            "function"
        ) {

            return window.obtenerNumero(
                valor
            );
        }

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {

            return 0;
        }

        let texto =
            String(valor)
                .trim()
                .replace("%", "")
                .replace(",", ".");

        const numero =
            Number(texto);

        return Number.isFinite(numero)
            ? numero
            : 0;
    }


    function escapeHtml(texto) {

        if (
            typeof window.escapeHtml ===
            "function"
        ) {

            return window.escapeHtml(
                texto
            );
        }

        const div =
            document.createElement("div");

        div.textContent =
            texto == null
                ? ""
                : String(texto);

        return div.innerHTML;
    }


    function formatearNumero(numero) {

        return obtenerNumero(numero)
            .toLocaleString(
                "es-CO",
                {
                    maximumFractionDigits: 2
                }
            );
    }


    function formatearPorcentaje(numero) {

        return (
            obtenerNumero(numero)
                .toFixed(2)
                .replace(/\.00$/, "") +
            "%"
        );
    }


    /* =========================================================
       LEER LOS DATOS
       ========================================================= */

    function leerDatosDesdeDOM() {

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
                JSON.parse(
                    contenido
                );

            if (
                !Array.isArray(datos) &&
                datos &&
                Array.isArray(datos.data)
            ) {

                datos =
                    datos.data;
            }

            return Array.isArray(datos)
                ? datos
                : [];

        } catch (error) {

            console.error(
                "❌ Error leyendo JSON de técnicos (panel pendientes):",
                error
            );

            return [];
        }
    }


    function obtenerDatosTecnicos() {

        /*
         * Prioridad 1: variable global ya cargada por el
         * script "RESULTADO POR TÉCNICO" (evita parsear el
         * JSON dos veces).
         */

        if (
            Array.isArray(
                window.Resultado_Auditorias_Tecnico
            ) &&
            window.Resultado_Auditorias_Tecnico.length > 0
        ) {

            return window.Resultado_Auditorias_Tecnico;
        }

        /*
         * Prioridad 2: leer directamente del DOM (por si
         * este panel se usa en una página donde el otro
         * script todavía no corrió).
         */

        return leerDatosDesdeDOM();
    }


    /* =========================================================
       DETERMINAR SI EL TÉCNICO TIENE AUDITORÍAS
       ========================================================= */

    function tieneAuditorias(item) {

        if (!item) {

            return false;
        }

        const valor =
            item.tiene_auditorias ??
            item.tieneAuditorias;

        if (
            valor === true ||
            valor === 1 ||
            valor === "1" ||
            valor === "true" ||
            valor === "True"
        ) {

            return true;
        }

        if (
            valor === false ||
            valor === 0 ||
            valor === "0" ||
            valor === "false" ||
            valor === "False"
        ) {

            return false;
        }

        return (
            obtenerNumero(
                item.total ??
                item.total_auditorias ??
                0
            ) > 0
        );
    }


    /* =========================================================
       CLASIFICAR TÉCNICO SEGÚN LA REGLA DEL 65%
       ========================================================= */

    function clasificarTecnico(item) {

        const auditado =
            tieneAuditorias(item);

        const total =
            obtenerNumero(
                item.total ??
                item.total_auditorias ??
                0
            );

        const noCumple =
            obtenerNumero(
                item.no_cumple ??
                0
            );

        /*
         * Si el back-end ya envía porcentaje_error, se usa
         * directamente. Si no, se calcula aquí mismo.
         */

        let porcentajeError =
            item.porcentaje_error !== undefined &&
            item.porcentaje_error !== null

                ? obtenerNumero(
                    item.porcentaje_error
                )

                : (
                    total > 0
                        ? (noCumple / total) * 100
                        : 0
                );

        if (!auditado) {

            return {

                auditado: false,

                porcentajeError: 0,

                estado: "Sin auditorías",

                claseEstado: "estado-sin-auditorias",

                accion: "Auditar",

                claseAccion: "accion-auditar",

                requiereReauditar: false

            };
        }

        if (porcentajeError >= UMBRAL_REAUDITAR) {

            return {

                auditado: true,

                porcentajeError: porcentajeError,

                estado: "Crítico",

                claseEstado: "estado-critico",

                accion: "Volver a auditar",

                claseAccion: "accion-reauditar",

                requiereReauditar: true

            };
        }

        return {

            auditado: true,

            porcentajeError: porcentajeError,

            estado: "Todo bien",

            claseEstado: "estado-todo-bien",

            accion: "Continuar seguimiento",

            claseAccion: "accion-ok",

            requiereReauditar: false

        };
    }


    /* =========================================================
       RENDER: RESUMEN
       ========================================================= */

    function renderizarResumen(clasificados) {

        const total =
            clasificados.length;

        const auditados =
            clasificados.filter(
                function (c) {

                    return c.clasificacion.auditado;
                }
            ).length;

        const sinAuditar =
            total - auditados;

        const paraReauditar =
            clasificados.filter(
                function (c) {

                    return c.clasificacion.requiereReauditar;
                }
            ).length;

        const alDia =
            auditados - paraReauditar;

        function pintar(id, valor) {

            const el =
                document.getElementById(id);

            if (el) {

                el.textContent = valor;
            }
        }

        pintar(
            "resumenTotalTecnicos",
            formatearNumero(total)
        );

        pintar(
            "resumenAuditados",
            formatearNumero(auditados)
        );

        pintar(
            "resumenPorcentajeAuditados",
            formatearPorcentaje(
                total > 0
                    ? (auditados / total) * 100
                    : 0
            )
        );

        pintar(
            "resumenSinAuditar",
            formatearNumero(sinAuditar)
        );

        pintar(
            "resumenPorcentajeSinAuditar",
            formatearPorcentaje(
                total > 0
                    ? (sinAuditar / total) * 100
                    : 0
            )
        );

        pintar(
            "resumenParaReauditar",
            formatearNumero(paraReauditar)
        );

        pintar(
            "resumenPorcentajeReauditar",
            formatearPorcentaje(
                total > 0
                    ? (paraReauditar / total) * 100
                    : 0
            )
        );

        pintar(
            "resumenAlDia",
            formatearNumero(alDia)
        );

        pintar(
            "resumenPorcentajeAlDia",
            formatearPorcentaje(
                total > 0
                    ? (alDia / total) * 100
                    : 0
            )
        );
    }


    /* =========================================================
       RENDER: TABLA SIN AUDITAR
       ========================================================= */

    function renderizarSinAuditar(clasificados) {

        const filas =
            clasificados
                .filter(
                    function (c) {

                        return !c.clasificacion.auditado;
                    }
                )
                .sort(
                    function (a, b) {

                        const supA =
                            (a.item.supervisor || "")
                                .toLowerCase();

                        const supB =
                            (b.item.supervisor || "")
                                .toLowerCase();

                        if (supA !== supB) {

                            return supA.localeCompare(
                                supB
                            );
                        }

                        return (
                            a.item.tecnico || ""
                        ).localeCompare(
                            b.item.tecnico || ""
                        );
                    }
                );

        if (filas.length === 0) {

            cuerpoSinAuditar.innerHTML = `
                <tr>
                    <td colspan="5" class="tabla-sin-datos">
                        Todos los técnicos tienen al menos una auditoría.
                    </td>
                </tr>
            `;

            return;
        }

        cuerpoSinAuditar.innerHTML =
            filas
                .map(
                    function (fila) {

                        const item =
                            fila.item;

                        const c =
                            fila.clasificacion;

                        return `
                            <tr>
                                <td>${escapeHtml(item.supervisor || "Sin supervisor")}</td>
                                <td>${escapeHtml(item.tecnico || "Sin técnico")}</td>
                                <td>${escapeHtml(item.cedula || "-")}</td>
                                <td>
                                    <span class="estado-badge ${c.claseEstado}">
                                        ${escapeHtml(c.estado)}
                                    </span>
                                </td>
                                <td>
                                    <span class="accion-badge ${c.claseAccion}">
                                        ${escapeHtml(c.accion)}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }
                )
                .join("");
    }


    /* =========================================================
       RENDER: TABLA PARA RE-AUDITAR
       ========================================================= */

    function renderizarReauditar(clasificados) {

        const filas =
            clasificados
                .filter(
                    function (c) {

                        return c.clasificacion.requiereReauditar;
                    }
                )
                .sort(
                    function (a, b) {

                        return (
                            b.clasificacion.porcentajeError -
                            a.clasificacion.porcentajeError
                        );
                    }
                );

        if (filas.length === 0) {

            cuerpoReauditar.innerHTML = `
                <tr>
                    <td colspan="8" class="tabla-sin-datos">
                        Ningún técnico supera el ${UMBRAL_REAUDITAR}% de errores.
                    </td>
                </tr>
            `;

            return;
        }

        cuerpoReauditar.innerHTML =
            filas
                .map(
                    function (fila) {

                        const item =
                            fila.item;

                        const c =
                            fila.clasificacion;

                        return `
                            <tr>
                                <td>${escapeHtml(item.supervisor || "Sin supervisor")}</td>
                                <td>${escapeHtml(item.tecnico || "Sin técnico")}</td>
                                <td>${escapeHtml(item.cedula || "-")}</td>
                                <td>${formatearNumero(item.total || 0)}</td>
                                <td>${formatearNumero(item.no_cumple || 0)}</td>
                                <td>${formatearPorcentaje(c.porcentajeError)}</td>
                                <td>
                                    <span class="estado-badge ${c.claseEstado}">
                                        ${escapeHtml(c.estado)}
                                    </span>
                                </td>
                                <td>
                                    <span class="accion-badge ${c.claseAccion}">
                                        ${escapeHtml(c.accion)}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }
                )
                .join("");
    }


    /* =========================================================
       RENDER GENERAL
       ========================================================= */

    function renderizarPanel() {

        const datos =
            obtenerDatosTecnicos();

        console.log(
            "📋 Panel pendientes - técnicos recibidos:",
            datos.length
        );

        const clasificados =
            datos.map(
                function (item) {

                    return {

                        item: item,

                        clasificacion:
                            clasificarTecnico(item)
                    };
                }
            );

        renderizarResumen(clasificados);

        renderizarSinAuditar(clasificados);

        renderizarReauditar(clasificados);
    }


    window.actualizarPanelTecnicosPendientes =
        renderizarPanel;


    /* =========================================================
       DIAGNÓSTICO: ¿existe el <script> con el JSON?
       ========================================================= */

    (function diagnosticoInicial() {

        const elemento =
            document.getElementById(
                "datos-Resultado-Auditorias-Tecnico"
            );

        if (!elemento) {

            console.error(
                "❌ [Panel pendientes] NO existe en esta página " +
                "el <script id=\"datos-Resultado-Auditorias-Tecnico\">. " +
                "Revisa que la plantilla que incluye este panel " +
                "también incluya ese bloque con {{ Resultado_Auditorias_Tecnico|safe }}."
            );

            return;
        }

        const contenido =
            elemento.textContent.trim();

        console.log(
            "🔍 [Panel pendientes] <script id=\"datos-Resultado-Auditorias-Tecnico\"> " +
            "encontrado. Longitud del contenido:",
            contenido.length
        );

        if (!contenido || contenido === "[]") {

            console.warn(
                "⚠️ [Panel pendientes] El bloque existe pero está vacío " +
                "([] o \"\"). Revisa que la vista/context processor esté " +
                "devolviendo Resultado_Auditorias_Tecnico con datos para " +
                "esta página."
            );
        }

    })();


    /* =========================================================
       PRIMERA CARGA + REINTENTOS
       =========================================================

       No asumimos que window.Resultado_Auditorias_Tecnico ya
       esté listo: si el script que lo globaliza se registra
       DESPUÉS de este en el HTML, en el primer intento vendría
       vacío. Por eso reintentamos varias veces antes de rendir
       el panel como "sin datos".
       ========================================================= */

    let intentosRestantes = 20;

    function intentarRenderizar() {

        const datos =
            obtenerDatosTecnicos();

        if (
            datos.length > 0 ||
            intentosRestantes <= 0
        ) {

            if (
                datos.length === 0
            ) {

                console.warn(
                    "⚠️ [Panel pendientes] Se agotaron los reintentos " +
                    "y no se encontraron técnicos. Los contadores " +
                    "quedarán en 0 hasta que llegue el evento " +
                    "'ResultadoAuditoriasTecnicoActualizado' o recargues la página."
                );
            }

            renderizarPanel();

            return;
        }

        intentosRestantes--;

        setTimeout(
            intentarRenderizar,
            250
        );
    }

    intentarRenderizar();


    /* =========================================================
       ACTUALIZAR CUANDO CAMBIEN LOS DATOS GLOBALES
       (emitido por tu script "RESULTADO POR TÉCNICO")
       ========================================================= */

    window.addEventListener(
        "ResultadoAuditoriasTecnicoActualizado",
        function () {

            console.log(
                "🔄 Panel pendientes: actualización global recibida"
            );

            intentosRestantes = 0;

            renderizarPanel();
        }
    );


    console.log(
        "✅ PANEL TÉCNICOS SIN AUDITAR / PARA RE-AUDITAR LISTO"
    );

});