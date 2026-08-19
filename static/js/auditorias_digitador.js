// ============================================================
// AUDITORÍAS POR DIGITADOR
// ============================================================


const elementoDatosDigitador =
    document.getElementById(
        'datos-Auditorias-Por-Digitador'
    );


if (!elementoDatosDigitador) {

    console.error(
        'No existe datos-Auditorias-Por-Digitador'
    );

} else {


    const datosDigitador =
        JSON.parse(
            elementoDatosDigitador.textContent
        );


    // ========================================================
    // SELECTORES
    // ========================================================

    const filtroAnio =
        document.getElementById(
            'filtroAnioDigitador'
        );


    const filtroMes =
        document.getElementById(
            'filtroMesDigitador'
        );


    // ========================================================
    // TOM SELECT
    // ========================================================

    const buscadorAnio =
        new TomSelect(
            '#filtroAnioDigitador',
            {

                placeholder:
                    'Buscar año...',

                searchField:
                    ['text'],

                sortField: {

                    field: 'text',

                    direction: 'desc'

                }

            }
        );


    const buscadorMes =
        new TomSelect(
            '#filtroMesDigitador',
            {

                placeholder:
                    'Buscar mes...',

                searchField:
                    ['text'],

                sortField: {

                    field: 'text',

                    direction: 'asc'

                }

            }
        );


    // ========================================================
    // OBTENER AÑO
    // ========================================================

    function obtenerAnio(fecha) {

        return fecha.substring(0, 4);

    }


    // ========================================================
    // OBTENER MES
    // ========================================================

    function obtenerMes(fecha) {

        return fecha.substring(5, 7);

    }


    // ========================================================
    // NOMBRES DE MESES
    // ========================================================

    const nombresMeses = {

        '01': 'Enero',
        '02': 'Febrero',
        '03': 'Marzo',
        '04': 'Abril',
        '05': 'Mayo',
        '06': 'Junio',
        '07': 'Julio',
        '08': 'Agosto',
        '09': 'Septiembre',
        '10': 'Octubre',
        '11': 'Noviembre',
        '12': 'Diciembre'

    };


    // ========================================================
    // FORMATEAR FECHA
    // ========================================================

    function formatearFecha(fecha) {

        const partes =
            fecha.split('-');

        return (
            partes[2] +
            '/' +
            partes[1] +
            '/' +
            partes[0]
        );

    }


    // ========================================================
    // FORMATEAR NÚMERO
    // ========================================================

    function formatearNumero(numero) {

        return Number(numero).toLocaleString(
            'es-CO'
        );

    }


    // ========================================================
    // CARGAR AÑOS
    // ========================================================

    const anios = [
        ...new Set(

            datosDigitador.map(function(dato) {

                return obtenerAnio(
                    dato.fecha_operacion
                );

            })

        )
    ];


    anios.sort(function(a, b) {

        return b.localeCompare(a);

    });


    anios.forEach(function(anio) {

        buscadorAnio.addOption({

            value: anio,

            text: anio

        });

    });


    buscadorAnio.refreshOptions(false);


    // ========================================================
    // CARGAR MESES
    // ========================================================

    for (
        let numero = 1;
        numero <= 12;
        numero++
    ) {

        const mes =
            String(numero).padStart(2, '0');


        buscadorMes.addOption({

            value: mes,

            text: nombresMeses[mes]

        });

    }


    buscadorMes.refreshOptions(false);


    // ========================================================
    // CONSTRUIR TABLA
    // ========================================================

    function construirTabla() {


        const anioSeleccionado =
            buscadorAnio.getValue();


        const mesSeleccionado =
            buscadorMes.getValue();


        // ====================================================
        // FILTRAR DATOS
        // ====================================================

        let datosFiltrados =
            [...datosDigitador];


        if (
            anioSeleccionado &&
            anioSeleccionado !== 'todos'
        ) {

            datosFiltrados =
                datosFiltrados.filter(
                    function(dato) {

                        return (
                            obtenerAnio(
                                dato.fecha_operacion
                            ) ===
                            anioSeleccionado
                        );

                    }
                );

        }


        if (
            mesSeleccionado &&
            mesSeleccionado !== 'todos'
        ) {

            datosFiltrados =
                datosFiltrados.filter(
                    function(dato) {

                        return (
                            obtenerMes(
                                dato.fecha_operacion
                            ) ===
                            mesSeleccionado
                        );

                    }
                );

        }


        // ====================================================
        // OBTENER DIGITADORES
        // ====================================================

        const digitadores = [

            ...new Set(

                datosFiltrados
                    .map(function(dato) {

                        return dato.nombre_auditor;

                    })
                    .filter(function(nombre) {

                        return (
                            nombre &&
                            nombre.trim() !== ''
                        );

                    })

            )

        ];


        digitadores.sort(
            function(a, b) {

                return a.localeCompare(
                    b,
                    'es'
                );

            }
        );


        // ====================================================
        // AGRUPAR POR FECHA
        // ====================================================

        const fechas = [

            ...new Set(

                datosFiltrados.map(
                    function(dato) {

                        return dato.fecha_operacion;

                    }
                )

            )

        ];


        fechas.sort(
            function(a, b) {

                return a.localeCompare(b);

            }
        );


        // ====================================================
        // CREAR MAPA
        // ====================================================

        const mapa = {};


        datosFiltrados.forEach(
            function(dato) {


                if (!mapa[dato.fecha_operacion]) {

                    mapa[dato.fecha_operacion] = {};

                }


                mapa[
                    dato.fecha_operacion
                ][
                    dato.nombre_auditor
                ] =
                    Number(dato.total);


            }
        );


        // ====================================================
        // CABECERA
        // ====================================================

        const cabecera =
            document.getElementById(
                'cabeceraAuditoriasDigitador'
            );


        cabecera.innerHTML = '';


        const filaCabecera =
            document.createElement('tr');


        const thFecha =
            document.createElement('th');


        thFecha.textContent =
            'Fecha';


        thFecha.className =
            'digitador-fecha';


        filaCabecera.appendChild(
            thFecha
        );


        digitadores.forEach(
            function(digitador) {

                const th =
                    document.createElement('th');


                th.textContent =
                    digitador;


                th.className =
                    'digitador-columna';


                filaCabecera.appendChild(
                    th
                );

            }
        );


        const thTotal =
            document.createElement('th');


        thTotal.textContent =
            'Total general';


        thTotal.className =
            'digitador-columna';


        filaCabecera.appendChild(
            thTotal
        );


        cabecera.appendChild(
            filaCabecera
        );


        // ====================================================
        // CUERPO
        // ====================================================

        const cuerpo =
            document.getElementById(
                'cuerpoAuditoriasDigitador'
            );


        cuerpo.innerHTML = '';


        // ====================================================
        // TOTALES POR DIGITADOR
        // ====================================================

        const totalesDigitadores = {};


        digitadores.forEach(
            function(digitador) {

                totalesDigitadores[
                    digitador
                ] = 0;

            }
        );


        let totalGeneral = 0;


        // ====================================================
        // UNA FILA POR DÍA
        // ====================================================

        fechas.forEach(
            function(fecha) {


                const fila =
                    document.createElement('tr');


                // --------------------------------------------
                // FECHA
                // --------------------------------------------

                const tdFecha =
                    document.createElement('td');


                tdFecha.textContent =
                    formatearFecha(fecha);


                tdFecha.className =
                    'digitador-fecha';


                fila.appendChild(
                    tdFecha
                );


                // --------------------------------------------
                // TOTAL DEL DÍA
                // --------------------------------------------

                let totalDia = 0;


                // --------------------------------------------
                // DIGITADORES
                // --------------------------------------------

                digitadores.forEach(
                    function(digitador) {


                        const cantidad =
                            mapa[fecha] &&
                            mapa[fecha][digitador]
                                ? Number(
                                    mapa[fecha][digitador]
                                )
                                : 0;


                        totalDia += cantidad;


                        totalesDigitadores[
                            digitador
                        ] += cantidad;


                        const td =
                            document.createElement('td');


                        td.textContent =
                            formatearNumero(
                                cantidad
                            );


                        td.className =
                            'digitador-numero';


                        fila.appendChild(
                            td
                        );

                    }
                );


                // --------------------------------------------
                // TOTAL DÍA
                // --------------------------------------------

                totalGeneral += totalDia;


                const tdTotal =
                    document.createElement('td');


                tdTotal.textContent =
                    formatearNumero(
                        totalDia
                    );


                tdTotal.className =
                    'digitador-total-dia';


                fila.appendChild(
                    tdTotal
                );


                cuerpo.appendChild(
                    fila
                );

            }
        );


        // ====================================================
        // PIE
        // ====================================================

        const pie =
            document.getElementById(
                'pieAuditoriasDigitador'
            );


        pie.innerHTML = '';


        const filaTotal =
            document.createElement('tr');


        const tdTexto =
            document.createElement('td');


        tdTexto.textContent =
            'Total general';


        tdTexto.className =
            'digitador-total-general';


        filaTotal.appendChild(
            tdTexto
        );


        digitadores.forEach(
            function(digitador) {


                const td =
                    document.createElement('td');


                td.textContent =
                    formatearNumero(
                        totalesDigitadores[
                            digitador
                        ]
                    );


                td.className =
                    'digitador-total-general';


                filaTotal.appendChild(
                    td
                );

            }
        );


        const tdFinal =
            document.createElement('td');


        tdFinal.textContent =
            formatearNumero(
                totalGeneral
            );


        tdFinal.className =
            'digitador-total-final';


        filaTotal.appendChild(
            tdFinal
        );


        pie.appendChild(
            filaTotal
        );


        // ====================================================
        // TOTAL SUPERIOR
        // ====================================================

        const totalElemento =
            document.getElementById(
                'totalAuditoriasDigitador'
            );


        totalElemento.textContent =
            formatearNumero(
                totalGeneral
            );

    }


    // ========================================================
    // EVENTOS
    // ========================================================

    buscadorAnio.on(
        'change',
        function() {

            construirTabla();

        }
    );


    buscadorMes.on(
        'change',
        function() {

            construirTabla();

        }
    );


    // ========================================================
    // INICIAL
    // ========================================================

    construirTabla();

}
