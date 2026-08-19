// ============================================================
// 6. CANTIDAD DE HALLAZGOS
// ============================================================

const elementoDatosHallazgos =
    document.getElementById(
        'datos-Errores-Por-Hallazgo'
    );


// ------------------------------------------------------------
// VALIDAR DATOS
// ------------------------------------------------------------

if (!elementoDatosHallazgos) {

    console.error(
        'No existe datos-Errores-Por-Hallazgo'
    );

} else {


    const datosErroresPorHallazgos =
        JSON.parse(
            elementoDatosHallazgos.textContent
        );


    console.log(
        'DATOS HALLAZGOS:',
        datosErroresPorHallazgos
    );


    // ========================================================
    // FUNCIONES FECHA
    // ========================================================

    function obtenerAnioHallazgoCantidad(fecha) {

        if (!fecha) {
            return '';
        }

        return String(fecha).substring(0, 4);

    }


    function obtenerMesHallazgoCantidad(fecha) {

        if (!fecha) {
            return '';
        }

        return String(fecha).substring(5, 7);

    }


    // ========================================================
    // MESES
    // ========================================================

    const nombresMesesHallazgosCantidad = {

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
    // SELECTORES
    // ========================================================

    const filtroAnioHallazgosCantidad =
        document.getElementById(
            'filtroAnioHallazgosCantidad'
        );


    const filtroMesHallazgosCantidad =
        document.getElementById(
            'filtroMesHallazgosCantidad'
        );


    // ========================================================
    // CARGAR AÑOS
    // ========================================================

    const anios = new Set();


    datosErroresPorHallazgos.forEach(
        function(item) {

            if (!item.fecha_operacion) {
                return;
            }

            anios.add(
                obtenerAnioHallazgoCantidad(
                    item.fecha_operacion
                )
            );

        }
    );


    Array.from(anios)
        .sort()
        .reverse()
        .forEach(
            function(anio) {

                filtroAnioHallazgosCantidad.add(
                    new Option(
                        anio,
                        anio
                    )
                );

            }
        );


    // ========================================================
    // CARGAR MESES
    // ========================================================

    for (
        let i = 1;
        i <= 12;
        i++
    ) {

        const mes =
            String(i).padStart(2, '0');


        filtroMesHallazgosCantidad.add(

            new Option(

                nombresMesesHallazgosCantidad[mes],

                mes

            )

        );

    }


    // ========================================================
    // VARIABLE GRÁFICA
    // ========================================================

    let graficaHallazgosCantidad = null;


    // ========================================================
    // ACTUALIZAR
    // ========================================================

    function actualizarGraficaHallazgosCantidad() {


        // ====================================================
        // OBTENER FILTROS
        // ====================================================

        const anio =
            filtroAnioHallazgosCantidad.value;


        const mes =
            filtroMesHallazgosCantidad.value;


        // ====================================================
        // FILTRAR
        // ====================================================

        let datos =
            [...datosErroresPorHallazgos];


        if (
            anio &&
            anio !== 'todos'
        ) {

            datos =
                datos.filter(
                    function(item) {

                        return (
                            obtenerAnioHallazgoCantidad(
                                item.fecha_operacion
                            ) === anio
                        );

                    }
                );

        }


        if (
            mes &&
            mes !== 'todos'
        ) {

            datos =
                datos.filter(
                    function(item) {

                        return (
                            obtenerMesHallazgoCantidad(
                                item.fecha_operacion
                            ) === mes
                        );

                    }
                );

        }


        // ====================================================
        // AGRUPAR POR HALLAZGO
        // ====================================================

        const agrupados = {};


        datos.forEach(
            function(item) {

                const hallazgo =
                    item.hallazgo;


                if (!hallazgo) {
                    return;
                }


                if (!agrupados[hallazgo]) {

                    agrupados[hallazgo] = 0;

                }


                agrupados[hallazgo] +=
                    Number(item.total || 0);

            }
        );


        // ====================================================
        // CONVERTIR ARRAY
        // ====================================================

        const resultados =
            Object.entries(agrupados)
                .map(
                    function([hallazgo, total]) {

                        return {

                            hallazgo:
                                hallazgo,

                            total:
                                total

                        };

                    }
                );


        // ====================================================
        // ORDENAR MAYOR A MENOR
        // ====================================================

        resultados.sort(
            function(a, b) {

                return b.total - a.total;

            }
        );


        // ====================================================
        // LABELS
        // ====================================================

        const labels =
            resultados.map(
                function(item) {

                    return item.hallazgo;

                }
            );


        // ====================================================
        // VALORES
        // ====================================================

        const valores =
            resultados.map(
                function(item) {

                    return item.total;

                }
            );


        // ====================================================
        // TOTAL
        // ====================================================

        const total =
            valores.reduce(
                function(suma, valor) {

                    return suma + valor;

                },
                0
            );


        document.getElementById(
            'totalHallazgosCantidad'
        ).textContent =
            total.toLocaleString('es-CO');


        // ====================================================
        // PERÍODO
        // ====================================================

        let periodo =
            'Período: ';


        if (
            anio === 'todos' &&
            mes === 'todos'
        ) {

            periodo +=
                'Todos los períodos';

        }

        else if (
            anio !== 'todos' &&
            mes === 'todos'
        ) {

            periodo +=
                anio;

        }

        else if (
            anio === 'todos' &&
            mes !== 'todos'
        ) {

            periodo +=
                nombresMesesHallazgosCantidad[mes];

        }

        else {

            periodo +=
                nombresMesesHallazgosCantidad[mes]
                + ' '
                + anio;

        }


        document.getElementById(
            'periodoHallazgosCantidad'
        ).textContent =
            periodo;


        // ====================================================
        // ALTURA
        // ====================================================

        const contenedor =
            document.getElementById(
                'contenedorGraficaHallazgosCantidad'
            );


        const altura =
            Math.max(
                350,
                labels.length * 45
            );


        contenedor.style.height =
            altura + 'px';


        // ====================================================
        // DESTRUIR ANTERIOR
        // ====================================================

        if (graficaHallazgosCantidad) {

            graficaHallazgosCantidad.destroy();

        }


        // ====================================================
        // CANVAS
        // ====================================================

        const canvas =
            document.getElementById(
                'graficaHallazgosCantidad'
            );


        // ====================================================
        // CREAR GRÁFICA
        // ====================================================

        graficaHallazgosCantidad =
            new Chart(
                canvas,
                {

                    type: 'bar',

                    plugins: [
                        ChartDataLabels
                    ],

                    data: {

                        labels: labels,

                        datasets: [{

                            label:
                                'Cantidad',

                            data:
                                valores,

                            backgroundColor:
                                '#ef4444',

                            borderRadius:
                                6,

                            borderSkipped:
                                false,

                            barThickness:
                                25,

                            maxBarThickness:
                                25

                        }]

                    },


                    options: {

                        indexAxis:
                            'y',

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        animation:
                            false,


                        layout: {

                            padding: {

                                right:
                                    60,

                                left:
                                    10

                            }

                        },


                        plugins: {

                            legend: {

                                display:
                                    false

                            },


                            datalabels: {

                                anchor:
                                    'end',

                                align:
                                    'end',

                                offset:
                                    5,

                                color:
                                    '#dc2626',

                                clip:
                                    false,

                                font: {

                                    size:
                                        12,

                                    weight:
                                        '700'

                                },

                                formatter:
                                    function(value) {

                                        return Number(
                                            value
                                        ).toLocaleString(
                                            'es-CO'
                                        );

                                    }

                            },


                            tooltip: {

                                callbacks: {

                                    title:
                                        function(context) {

                                            return context[0]
                                                .label;

                                        },


                                    label:
                                        function(context) {

                                            return (
                                                ' Cantidad: ' +
                                                Number(
                                                    context.parsed.x
                                                ).toLocaleString(
                                                    'es-CO'
                                                )
                                            );

                                        }

                                }

                            }

                        },


                        scales: {

                            x: {

                                beginAtZero:
                                    true,

                                ticks: {

                                    color:
                                        '#64748b',

                                    font: {

                                        size:
                                            10

                                    }

                                },

                                grid: {

                                    color:
                                        '#e2e8f0'

                                }

                            },


                            y: {

                                offset:
                                    true,

                                ticks: {

                                    color:
                                        '#334155',

                                    font: {

                                        size:
                                            11,

                                        weight:
                                            '600'

                                    },

                                    padding:
                                        8

                                },

                                grid: {

                                    display:
                                        false

                                }

                            }

                        }

                    }

                }
            );

    }


    // ============================================================
    // EXPORTAR EXCEL CON LOS MISMOS FILTROS
    // CANTIDAD DE HALLAZGOS
    // ============================================================

    const botonExportarHallazgos =
        document.getElementById(
            'btnExportarEstadisticas'
        );


    function actualizarUrlExportacionHallazgos() {

        if (!botonExportarHallazgos) {
            return;
        }


        const anio =
            filtroAnioHallazgosCantidad.value;


        const mes =
            filtroMesHallazgosCantidad.value;


        const url =
            new URL(
                botonExportarHallazgos.href,
                window.location.origin
            );


        // --------------------------------------------------------
        // LIMPIAR PARÁMETROS ANTERIORES
        // --------------------------------------------------------

        url.searchParams.delete(
            'anio_hallazgos'
        );

        url.searchParams.delete(
            'mes_hallazgos'
        );


        // --------------------------------------------------------
        // AÑO
        // --------------------------------------------------------

        if (
            anio &&
            anio !== 'todos'
        ) {

            url.searchParams.set(
                'anio_hallazgos',
                anio
            );

        }


        // --------------------------------------------------------
        // MES
        // --------------------------------------------------------

        if (
            mes &&
            mes !== 'todos'
        ) {

            url.searchParams.set(
                'mes_hallazgos',
                mes
            );

        }


        botonExportarHallazgos.href =
            url.toString();

    }


    // ============================================================
    // EVENTOS
    // ============================================================

    filtroAnioHallazgosCantidad.addEventListener(
        'change',
        function() {

            actualizarGraficaHallazgosCantidad();

            actualizarUrlExportacionHallazgos();

        }
    );


    filtroMesHallazgosCantidad.addEventListener(
        'change',
        function() {

            actualizarGraficaHallazgosCantidad();

            actualizarUrlExportacionHallazgos();

        }
    );


    // ============================================================
    // INICIAL
    // ============================================================

    actualizarUrlExportacionHallazgos();


    // ========================================================
    // INICIAL
    // ========================================================

    actualizarGraficaHallazgosCantidad();

}