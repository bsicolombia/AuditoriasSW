// ============================================================
// 2. DATOS DE TÉCNICOS
// ============================================================

const datosTecnicos = JSON.parse(

    document.getElementById(
        'datos-tecnicos'
    ).textContent

);


// ============================================================
// ORDENAR TÉCNICOS
// ============================================================

datosTecnicos.sort(function(a, b) {

    return numero(b.total) - numero(a.total);

});


// ============================================================
// SELECT TÉCNICO
// ============================================================

const filtroTecnico =
    document.getElementById(
        'filtroTecnico'
    );


// ============================================================
// CARGAR TÉCNICOS
// ============================================================

datosTecnicos.forEach(function(tecnico) {

    filtroTecnico.add(

        new Option(

            tecnico.nombre_tecnico +
            ' (' +
            formatearNumero(tecnico.total) +
            ')',

            tecnico.nombre_tecnico

        )

    );

});


// ============================================================
// TOM SELECT TÉCNICO
// ============================================================

const buscadorTecnico =
    new TomSelect(

        '#filtroTecnico',

        {

            placeholder:
                'Buscar técnico...',

            searchField:
                ['text'],

            sortField: {

                field: 'text',

                direction: 'asc'

            }

        }

    );


// ============================================================
// GRÁFICA TÉCNICOS
// ============================================================

let graficaTecnicos = null;


function actualizarGraficaTecnicos() {

    const tecnicoSeleccionado =
        buscadorTecnico.getValue();


    let datosFiltrados = [
        ...datosTecnicos
    ];


    if (

        tecnicoSeleccionado &&
        tecnicoSeleccionado !== 'todos'

    ) {

        datosFiltrados =
            datosFiltrados.filter(function(tecnico) {

                return (
                    tecnico.nombre_tecnico ===
                    tecnicoSeleccionado
                );

            });

    }


    const nombres = [];

    const cantidades = [];


    datosFiltrados.forEach(function(tecnico) {

        nombres.push(
            tecnico.nombre_tecnico
        );

        cantidades.push(
            numero(tecnico.total)
        );

    });


    const contenedor =
        document.getElementById(
            'contenedorGraficaTecnicos'
        );


    const alturaPorTecnico = 38;

    const alturaMinima = 350;


    contenedor.style.height =

        Math.max(

            alturaMinima,

            nombres.length *
            alturaPorTecnico

        ) + 'px';


    if (graficaTecnicos) {

        graficaTecnicos.destroy();

    }


    const canvas =
        document.getElementById(
            'graficaTecnicos'
        );


    graficaTecnicos = new Chart(

        canvas,

        {

            type: 'bar',

            plugins: [
                ChartDataLabels
            ],

            data: {

                labels: nombres,

                datasets: [{

                    label: 'Auditorías',

                    data: cantidades,

                    backgroundColor:
                        '#8b5cf6',

                    borderRadius: 6,

                    borderSkipped: false,

                    barThickness: 22,

                    maxBarThickness: 22

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

                        ticks: {

                            color: '#334155',

                            font: {

                                size: 11

                            }

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


buscadorTecnico.on(

    'change',

    actualizarGraficaTecnicos

);


actualizarGraficaTecnicos();