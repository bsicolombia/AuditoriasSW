document.addEventListener("DOMContentLoaded", function () {

    /*
     * ================================================
     * TOM SELECT
     * ================================================
     */

    document
        .querySelectorAll(".select-filtro")
        .forEach(function (elemento) {

            new TomSelect(
                elemento,
                {
                    create: false,
                    allowEmptyOption: true,
                    maxOptions: 1000
                }
            );

        });


    /*
     * ================================================
     * EVITAR ENVÍO CON CAMPOS VACÍOS
     * ================================================
     */

    const formulario = document.getElementById(
        "formFiltrosEstadisticas"
    );

    if (formulario) {

        formulario.addEventListener(
            "submit",
            function () {

                formulario
                    .querySelectorAll("select")
                    .forEach(function (select) {

                        if (!select.value) {
                            select.disabled = true;
                        }

                    });

            }
        );

    }

});
document.addEventListener("DOMContentLoaded", function () {

    const formulario = document.getElementById(
        "formFiltrosEstadisticas"
    );

    const botonExportar = document.getElementById(
        "btnExportarEstadisticas"
    );

    if (formulario && botonExportar) {

        botonExportar.addEventListener(
            "click",
            function () {

                const params = new URLSearchParams(
                    new FormData(formulario)
                );

                botonExportar.href =
                    botonExportar.dataset.url +
                    "?" +
                    params.toString();

            }
        );

        botonExportar.dataset.url =
            botonExportar.href;

    }

});
