// ============================================================
// 4. AUDITORÍAS QUE NO CUMPLEN
// ============================================================

const datosNoCumplen = JSON.parse(

    document.getElementById(
        'datos-No-Cumplen'
    ).textContent

);


datosNoCumplen.sort(function(a, b) {

    return (
        a.fecha_operacion.localeCompare(
            b.fecha_operacion
        )
    );

});



// ============================================================
// SELECTORES
// ============================================================

const filtroAnioNoCumplen =
    document.getElementById(
        'filtroAnioNoCumplen'
    );


const filtroMesNoCumplen =
    document.getElementById(
        'filtroMesNoCumplen'
    );


// ============================================================
// CARGAR AÑOS
// ============================================================

const aniosNoCumplen = [

    ...new Set(

        datosNoCumplen.map(function(auditoria) {

            return obtenerAnio(
                auditoria.fecha_operacion
            );

        })

    )

];


aniosNoCumplen.sort(function(a, b) {

    return b.localeCompare(a);

});


aniosNoCumplen.forEach(function(anio) {

    filtroAnioNoCumplen.add(

        new Option(
            anio,
            anio
        )

    );

});


// ============================================================
// CARGAR MESES
// ============================================================

for (let numeroMes = 1; numeroMes <= 12; numeroMes++) {

    const mes =
        String(numeroMes).padStart(2, '0');


    filtroMesNoCumplen.add(

        new Option(

            nombresMeses[mes],

            mes

        )

    );

}


// ============================================================
// GRÁFICA
// ============================================================

let graficaNoCumplen = null;


function actualizarGraficaNoCumplen() {

    const anioSeleccionado =
        filtroAnioNoCumplen.value;


    const mesSeleccionado =
        filtroMesNoCumplen.value;


    let datosFiltrados =
        [...datosNoCumplen];


    // --------------------------------------------------------
    // AÑO
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
    // MES
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
    // ORDENAR
    // --------------------------------------------------------

    datosFiltrados.sort(function(a, b) {

        return (
            a.fecha_operacion.localeCompare(
                b.fecha_operacion
            )
        );

    });


    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    const total =
        datosFiltrados.reduce(function(total, auditoria) {

            return (
                total +
                numero(auditoria.total)
            );

        }, 0);


    document.getElementById(
        'totalNoCumplen'
    ).textContent =
        formatearNumero(total);


    // --------------------------------------------------------
    // DATOS CHART
    // --------------------------------------------------------

    const fechas = [];

    const cantidades = [];


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


    // --------------------------------------------------------
    // ALTURA
    // --------------------------------------------------------

    const contenedor =
        document.getElementById(
            'contenedorGraficaNoCumplen'
        );


    const alturaPorDia = 42;

    const alturaMinima = 350;


    contenedor.style.height =

        Math.max(

            alturaMinima,

            fechas.length *
            alturaPorDia

        ) + 'px';


    // --------------------------------------------------------
    // DESTRUIR
    // --------------------------------------------------------

    if (graficaNoCumplen) {

        graficaNoCumplen.destroy();

    }


    // --------------------------------------------------------
    // CREAR
    // --------------------------------------------------------

    const canvas =
        document.getElementById(
            'graficaNoCumplen'
        );


    graficaNoCumplen = new Chart(

        canvas,

        {

            type: 'bar',

            plugins: [
                ChartDataLabels
            ],

            data: {

                labels: fechas,

                datasets: [{

                    label: 'No cumplen',

                    data: cantidades,

                    backgroundColor:
                        '#ef4444',

                    borderRadius: 6,

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

                        right: 50

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

                        color: '#dc2626',

                        clip: false,

                        font: {

                            size: 12,

                            weight: '700'

                        },

                        formatter: function(value) {

                            return formatearNumero(value);

                        }

                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return (

                                    ' No cumplen: ' +

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
// EVENTOS
// ============================================================

filtroAnioNoCumplen.addEventListener(

    'change',

    actualizarGraficaNoCumplen

);


filtroMesNoCumplen.addEventListener(

    'change',

    actualizarGraficaNoCumplen

);


// ============================================================
// CARGAR INICIAL
// ============================================================

actualizarGraficaNoCumplen();