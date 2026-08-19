// ============================================================
// 5. HALLAZGOS POR TÉCNICO
// ============================================================

const datosHallazgosTecnico = JSON.parse(

    document.getElementById(
        'datos-Hallazgos-Tecnico'
    ).textContent

);


// ============================================================
// FUNCIONES
// ============================================================

function obtenerAnioHallazgo(fecha) {

    if (!fecha) {
        return '';
    }

    return String(fecha).split('-')[0];

}


function obtenerMesHallazgo(fecha) {

    if (!fecha) {
        return '';
    }

    return String(fecha).split('-')[1];

}


function numeroHallazgo(valor) {

    return Number(valor || 0);

}


// ============================================================
// MESES
// ============================================================

const nombresMesesHallazgos = {

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


// ============================================================
// SELECTORES
// ============================================================

const filtroAnioHallazgosTecnico =
    document.getElementById(
        'filtroAnioHallazgos'
    );


const filtroMesHallazgosTecnico =
    document.getElementById(
        'filtroMesHallazgos'
    );


// ============================================================
// CARGAR AÑOS
// ============================================================

const aniosHallazgos =
    new Set();


datosHallazgosTecnico.forEach(
    function(hallazgo) {

        if (!hallazgo.fecha_operacion) {
            return;
        }

        const anio =
            obtenerAnioHallazgo(
                hallazgo.fecha_operacion
            );

        if (anio) {

            aniosHallazgos.add(anio);

        }

    }
);


// ============================================================
// ORDENAR AÑOS
// ============================================================

const listaAniosHallazgos =
    Array.from(aniosHallazgos);


listaAniosHallazgos.sort(
    function(a, b) {

        return b.localeCompare(a);

    }
);


// ============================================================
// INSERTAR AÑOS
// ============================================================

listaAniosHallazgos.forEach(
    function(anio) {

        filtroAnioHallazgosTecnico.add(
            new Option(
                anio,
                anio
            )
        );

    }
);


// ============================================================
// CARGAR MESES
// ============================================================

for (
    let numeroMes = 1;
    numeroMes <= 12;
    numeroMes++
) {

    const mes =
        String(numeroMes).padStart(
            2,
            '0'
        );


    filtroMesHallazgosTecnico.add(
        new Option(
            nombresMesesHallazgos[mes],
            mes
        )
    );

}


// ============================================================
// VARIABLE GRÁFICA
// ============================================================

let graficaHallazgosTecnico = null;


// ============================================================
// ACTUALIZAR GRÁFICA
// ============================================================

function actualizarGraficaHallazgosTecnico() {

    const anioSeleccionado =
        filtroAnioHallazgosTecnico.value;


    const mesSeleccionado =
        filtroMesHallazgosTecnico.value;


    // ========================================================
    // COPIAR DATOS
    // ========================================================

    let datosFiltrados = [
        ...datosHallazgosTecnico
    ];


    // ========================================================
    // FILTRO AÑO
    // ========================================================

    if (
        anioSeleccionado &&
        anioSeleccionado !== 'todos'
    ) {

        datosFiltrados =
            datosFiltrados.filter(
                function(hallazgo) {

                    return (

                        hallazgo.fecha_operacion &&

                        obtenerAnioHallazgo(
                            hallazgo.fecha_operacion
                        ) ===
                        anioSeleccionado

                    );

                }
            );

    }


    // ========================================================
    // FILTRO MES
    // ========================================================

    if (
        mesSeleccionado &&
        mesSeleccionado !== 'todos'
    ) {

        datosFiltrados =
            datosFiltrados.filter(
                function(hallazgo) {

                    return (

                        hallazgo.fecha_operacion &&

                        obtenerMesHallazgo(
                            hallazgo.fecha_operacion
                        ) ===
                        mesSeleccionado

                    );

                }
            );

    }


    // ========================================================
    // AGRUPAR POR TÉCNICO
    // ========================================================

    const hallazgosPorTecnico = {};


    datosFiltrados.forEach(
        function(hallazgo) {

            const tecnico =
                hallazgo.nombre_tecnico;


            if (!tecnico) {
                return;
            }


            if (
                !hallazgosPorTecnico[tecnico]
            ) {

                hallazgosPorTecnico[tecnico] =
                    0;

            }


            hallazgosPorTecnico[tecnico] +=
                numeroHallazgo(
                    hallazgo.total
                );

        }
    );


    // ========================================================
    // CONVERTIR A ARRAY
    // ========================================================

    const datosAgrupados =
        Object.entries(
            hallazgosPorTecnico
        ).map(
            function([tecnico, total]) {

                return {

                    nombre_tecnico:
                        tecnico,

                    total:
                        total

                };

            }
        );


    // ========================================================
    // ORDENAR MAYOR A MENOR
    // ========================================================

    datosAgrupados.sort(
        function(a, b) {

            return (
                b.total -
                a.total
            );

        }
    );


    // ========================================================
    // LABELS Y DATOS
    // ========================================================

    const nombres = [];

    const cantidades = [];


    datosAgrupados.forEach(
        function(tecnico) {

            nombres.push(
                tecnico.nombre_tecnico
            );


            cantidades.push(
                numeroHallazgo(
                    tecnico.total
                )
            );

        }
    );


    // ========================================================
    // TOTAL
    // ========================================================

    const total =
        cantidades.reduce(
            function(acumulado, valor) {

                return (
                    acumulado +
                    valor
                );

            },
            0
        );


    document.getElementById(
        'totalHallazgosTecnico'
    ).textContent =
        total.toLocaleString('es-CO');


    // ========================================================
    // TEXTO PERÍODO
    // ========================================================

    let textoPeriodo =
        'Período: ';


    if (
        anioSeleccionado === 'todos' &&
        mesSeleccionado === 'todos'
    ) {

        textoPeriodo +=
            'Todos los períodos';

    }

    else if (
        anioSeleccionado !== 'todos' &&
        mesSeleccionado === 'todos'
    ) {

        textoPeriodo +=
            anioSeleccionado;

    }

    else if (
        anioSeleccionado === 'todos' &&
        mesSeleccionado !== 'todos'
    ) {

        textoPeriodo +=
            nombresMesesHallazgos[
                mesSeleccionado
            ];

    }

    else {

        textoPeriodo +=
            nombresMesesHallazgos[
                mesSeleccionado
            ] +
            ' ' +
            anioSeleccionado;

    }


    document.getElementById(
        'periodoHallazgosTecnico'
    ).textContent =
        textoPeriodo;


    // ========================================================
    // CONTENEDOR
    // ========================================================

    const contenedor =
        document.getElementById(
            'contenedorGraficaHallazgosTecnico'
        );


    const alturaPorTecnico = 38;

    const alturaMinima = 350;


    contenedor.style.height =

        Math.max(
            alturaMinima,
            nombres.length *
            alturaPorTecnico
        ) + 'px';


    // ========================================================
    // DESTRUIR GRÁFICA ANTERIOR
    // ========================================================

    if (graficaHallazgosTecnico) {

        graficaHallazgosTecnico.destroy();

    }


    // ========================================================
    // CANVAS
    // ========================================================

    const canvas =
        document.getElementById(
            'graficaHallazgosTecnico'
        );


    // ========================================================
    // CREAR GRÁFICA
    // ========================================================

    graficaHallazgosTecnico =
        new Chart(
            canvas,
            {

                type: 'bar',

                plugins: [
                    ChartDataLabels
                ],

                data: {

                    labels: nombres,

                    datasets: [{

                        label:
                            'Hallazgos',

                        data:
                            cantidades,

                        backgroundColor:
                            '#ef4444',

                        borderRadius:
                            6,

                        borderSkipped:
                            false,

                        barThickness:
                            22,

                        maxBarThickness:
                            22

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

                            right: 50

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
                                    11,

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

                                label:
                                    function(context) {

                                        return (

                                            ' Hallazgos: ' +

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

                            ticks: {

                                color:
                                    '#334155',

                                font: {

                                    size:
                                        11

                                }

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
// EVENTO AÑO
// ============================================================

filtroAnioHallazgosTecnico.addEventListener(
    'change',
    actualizarGraficaHallazgosTecnico
);


// ============================================================
// EVENTO MES
// ============================================================

filtroMesHallazgosTecnico.addEventListener(
    'change',
    actualizarGraficaHallazgosTecnico
);


// ============================================================
// CARGAR INICIAL
// ============================================================

actualizarGraficaHallazgosTecnico();