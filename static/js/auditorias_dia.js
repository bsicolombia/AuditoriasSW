// ============================================================
// 3. AUDITORÍAS POR DÍA
// ============================================================

const datosPorDia = JSON.parse(

    document.getElementById(
        'datos-Auditoria_Dia'
    ).textContent

);


datosPorDia.sort(function(a, b) {

    return (
        a.fecha_operacion.localeCompare(
            b.fecha_operacion
        )
    );

});


// ============================================================
// SELECTORES
// ============================================================

const filtroAnio =
    document.getElementById(
        'filtroAnio'
    );


const filtroMes =
    document.getElementById(
        'filtroMes'
    );


const filtroAuditoriaDia =
    document.getElementById(
        'filtroAuditoriaDia'
    );


// ============================================================
// TOM SELECT AÑO
// ============================================================

const buscadorAnio =
    new TomSelect(

        '#filtroAnio',

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


// ============================================================
// TOM SELECT MES
// ============================================================

const buscadorMes =
    new TomSelect(

        '#filtroMes',

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


// ============================================================
// TOM SELECT DÍA
// ============================================================

const buscadorDia =
    new TomSelect(

        '#filtroAuditoriaDia',

        {

            placeholder:
                'Buscar día...',

            searchField:
                ['text'],

            sortField: {

                field: 'text',

                direction: 'asc'

            }

        }

    );


// ============================================================
// CARGAR AÑOS
// ============================================================

const anios = [

    ...new Set(

        datosPorDia.map(function(auditoria) {

            return obtenerAnio(
                auditoria.fecha_operacion
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


// ============================================================
// CARGAR MESES
// ============================================================

for (let numero = 1; numero <= 12; numero++) {

    const mes =
        String(numero).padStart(2, '0');


    buscadorMes.addOption({

        value: mes,

        text: nombresMeses[mes]

    });

}


buscadorMes.refreshOptions(false);


// ============================================================
// CARGAR DÍAS SEGÚN AÑO Y MES
// ============================================================

function cargarDias() {

    const anioSeleccionado =
        buscadorAnio.getValue();


    const mesSeleccionado =
        buscadorMes.getValue();


    buscadorDia.clear();

    buscadorDia.clearOptions();


    buscadorDia.addOption({

        value: 'todos',

        text: 'Todos los días'

    });


    let diasDisponibles =
        [...datosPorDia];


    if (

        anioSeleccionado &&
        anioSeleccionado !== 'todos'

    ) {

        diasDisponibles =
            diasDisponibles.filter(function(auditoria) {

                return (

                    obtenerAnio(
                        auditoria.fecha_operacion
                    ) ===
                    anioSeleccionado

                );

            });

    }


    if (

        mesSeleccionado &&
        mesSeleccionado !== 'todos'

    ) {

        diasDisponibles =
            diasDisponibles.filter(function(auditoria) {

                return (

                    obtenerMes(
                        auditoria.fecha_operacion
                    ) ===
                    mesSeleccionado

                );

            });

    }


    diasDisponibles.sort(function(a, b) {

        return (
            a.fecha_operacion.localeCompare(
                b.fecha_operacion
            )
        );

    });


    diasDisponibles.forEach(function(auditoria) {

        buscadorDia.addOption({

            value:
                auditoria.fecha_operacion,

            text:

                formatearFecha(
                    auditoria.fecha_operacion
                ) +

                ' (' +

                formatearNumero(
                    auditoria.total
                ) +

                ')'

        });

    });


    buscadorDia.refreshOptions(false);

}


cargarDias();


// ============================================================
// GRÁFICA AUDITORÍAS POR DÍA
// ============================================================

let graficaAuditoriaDia = null;


function actualizarGraficaAuditoriaDia() {

    const anioSeleccionado =
        buscadorAnio.getValue();


    const mesSeleccionado =
        buscadorMes.getValue();


    const diaSeleccionado =
        buscadorDia.getValue();


    let datosFiltrados =
        [...datosPorDia];


    // --------------------------------------------------------
    // FILTRO AÑO
    // --------------------------------------------------------

    if (

        anioSeleccionado &&
        anioSeleccionado !== 'todos'

    ) {

        datosFiltrados =
            datosFiltrados.filter(function(auditoria) {

                return (

                    obtenerAnio(
                        auditoria.fecha_operacion
                    ) ===
                    anioSeleccionado

                );

            });

    }


    // --------------------------------------------------------
    // FILTRO MES
    // --------------------------------------------------------

    if (

        mesSeleccionado &&
        mesSeleccionado !== 'todos'

    ) {

        datosFiltrados =
            datosFiltrados.filter(function(auditoria) {

                return (

                    obtenerMes(
                        auditoria.fecha_operacion
                    ) ===
                    mesSeleccionado

                );

            });

    }


    // --------------------------------------------------------
    // FILTRO DÍA
    // --------------------------------------------------------

    if (

        diaSeleccionado &&
        diaSeleccionado !== 'todos'

    ) {

        datosFiltrados =
            datosFiltrados.filter(function(auditoria) {

                return (

                    auditoria.fecha_operacion ===
                    diaSeleccionado

                );

            });

    }


    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    const totalFiltrado =
        datosFiltrados.reduce(function(total, auditoria) {

            return (
                total +
                numero(auditoria.total)
            );

        }, 0);


    const totalElemento =
        document.getElementById(
            'totalAuditoriasFiltrado'
        );


    totalElemento.textContent =
        formatearNumero(totalFiltrado);


    // --------------------------------------------------------
    // DATOS DEL GRÁFICO
    // --------------------------------------------------------

    let fechas = [];

    let cantidades = [];


    // --------------------------------------------------------
    // SI SE SELECCIONA AÑO SIN MES
    // MOSTRAR LOS 12 MESES
    // --------------------------------------------------------

    if (

        anioSeleccionado &&
        anioSeleccionado !== 'todos' &&
        (
            !mesSeleccionado ||
            mesSeleccionado === 'todos'
        )

    ) {

        const nombres = [

            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre'

        ];


        const totales =
            Array(12).fill(0);


        datosFiltrados.forEach(function(auditoria) {

            const mes =
                Number(
                    obtenerMes(
                        auditoria.fecha_operacion
                    )
                );


            if (mes >= 1 && mes <= 12) {

                totales[mes - 1] +=
                    numero(auditoria.total);

            }

        });


        fechas = nombres;

        cantidades = totales;

    }


    // --------------------------------------------------------
    // SI NO ES AÑO COMPLETO
    // MOSTRAR POR DÍA
    // --------------------------------------------------------

    else {

        datosFiltrados.sort(function(a, b) {

            return (
                a.fecha_operacion.localeCompare(
                    b.fecha_operacion
                )
            );

        });


        datosFiltrados.forEach(function(auditoria) {

            fechas.push(
                formatearFecha(
                    auditoria.fecha_operacion
                )
            );

            cantidades.push(
                numero(auditoria.total)
            );

        });

    }


    // --------------------------------------------------------
    // CONTENEDOR
    // --------------------------------------------------------

    const contenedor =
        document.getElementById(
            'ContenedorGraficaAuditoriaDia'
        );


    const alturaPorRegistro = 42;

    const alturaMinima = 350;


    contenedor.style.height =

        Math.max(

            alturaMinima,

            fechas.length *
            alturaPorRegistro

        ) + 'px';


    // --------------------------------------------------------
    // DESTRUIR GRÁFICA ANTERIOR
    // --------------------------------------------------------

    if (graficaAuditoriaDia) {

        graficaAuditoriaDia.destroy();

    }


    // --------------------------------------------------------
    // CREAR GRÁFICA
    // --------------------------------------------------------

    const canvas =
        document.getElementById(
            'graficaAuditoria_dia'
        );


    graficaAuditoriaDia = new Chart(

        canvas,

        {

            type: 'bar',

            plugins: [
                ChartDataLabels
            ],

            data: {

                labels: fechas,

                datasets: [{

                    label: 'Auditorías',

                    data: cantidades,

                    backgroundColor:
                        '#8b5cf6',

                    borderRadius: 5,

                    borderSkipped: false,

                    barThickness: 24,

                    maxBarThickness: 24

                }]

            },

            options: {

                indexAxis: 'y',

                responsive: true,

                maintainAspectRatio: false,

                animation: false,

                layout: {

                    padding: {

                        right: 45

                    }

                },

                plugins: {

                    legend: {

                        display: false

                    },

                    datalabels: {

                        anchor: 'end',

                        align: 'end',

                        offset: 5,

                        color: '#334155',

                        clip: false,

                        font: {

                            size: 11,

                            weight: '600'

                        },

                        formatter: function(value) {

                            return formatearNumero(value);

                        }

                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return (
                                    ' Auditorías: ' +
                                    formatearNumero(
                                        context.parsed.x
                                    )
                                );

                            }

                        }

                    }

                },

                scales: {

                    x: {

                        beginAtZero: true,

                        ticks: {

                            color: '#64748b',

                            font: {
                                size: 10
                            }

                        },

                        grid: {

                            color: '#e2e8f0'

                        }

                    },

                    y: {

                        offset: true,

                        ticks: {

                            color: '#334155',

                            font: {

                                size: 11,

                                weight: '600'

                            },

                            padding: 8

                        },

                        grid: {

                            display: false

                        }

                    }

                }

            }

        }

    );

}


// ============================================================
// EVENTOS DE FILTROS
// ============================================================

buscadorAnio.on(

    'change',

    function() {

        buscadorDia.setValue(
            'todos',
            true
        );

        cargarDias();

        actualizarGraficaAuditoriaDia();

    }

);


buscadorMes.on(

    'change',

    function() {

        buscadorDia.setValue(
            'todos',
            true
        );

        cargarDias();

        actualizarGraficaAuditoriaDia();

    }

);


buscadorDia.on(

    'change',

    function() {

        actualizarGraficaAuditoriaDia();

    }

);


// ============================================================
// CARGAR GRÁFICA INICIAL
// ============================================================

actualizarGraficaAuditoriaDia();
