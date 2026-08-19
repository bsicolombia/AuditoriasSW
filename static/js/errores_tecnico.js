// ============================================================
// 6. ERRORES COMETIDOS POR LOS TÉCNICOS
// ============================================================


// ============================================================
// DATOS DJANGO
// ============================================================

const datosErroresPorTecnicos = JSON.parse(

    document.getElementById(
        'datos-Errores-Por-Tecnicos'
    ).textContent

);


console.log(
    'Errores por técnicos:',
    datosErroresPorTecnicos
);


// ============================================================
// FUNCIONES DE FECHA
// ============================================================

function obtenerAnioError(fecha) {

    if (!fecha) {
        return '';
    }

    return String(fecha).split('-')[0];

}


function obtenerMesError(fecha) {

    if (!fecha) {
        return '';
    }

    return String(fecha).split('-')[1];

}


// ============================================================
// MESES
// ============================================================

const nombresMesesErrores = {

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

const filtroAnioErroresTecnico =
    document.getElementById(
        'filtroAnioErroresTecnico'
    );


const filtroMesErroresTecnico =
    document.getElementById(
        'filtroMesErroresTecnico'
    );


// ============================================================
// CARGAR AÑOS
// ============================================================

const aniosErrores = new Set();


datosErroresPorTecnicos.forEach(function(error) {

    if (!error.fecha_operacion) {
        return;
    }

    const anio =
        obtenerAnioError(
            error.fecha_operacion
        );

    if (anio) {
        aniosErrores.add(anio);
    }

});


const listaAniosErrores =
    Array.from(aniosErrores);


listaAniosErrores.sort(function(a, b) {

    return b.localeCompare(a);

});


listaAniosErrores.forEach(function(anio) {

    filtroAnioErroresTecnico.add(

        new Option(
            anio,
            anio
        )

    );

});


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


    filtroMesErroresTecnico.add(

        new Option(

            nombresMesesErrores[mes],

            mes

        )

    );

}


// ============================================================
// VARIABLE GRÁFICA
// ============================================================

let graficaErroresTecnico = null;


/* ============================================================
   AGRUPAR ERRORES POR TÉCNICO
   ============================================================ */

function agruparErroresPorTecnico(datos) {

    const tecnicos = {};

    datos.forEach(function(error) {

        const tecnico = error.nombre_tecnico;
        const hallazgo = error.hallazgo;

        if (!tecnico || !hallazgo) {
            return;
        }

        if (!tecnicos[tecnico]) {

            tecnicos[tecnico] = {
                total: 0,
                hallazgos: {}
            };

        }

        tecnicos[tecnico].total += 1;

        if (!tecnicos[tecnico].hallazgos[hallazgo]) {

            tecnicos[tecnico].hallazgos[hallazgo] = 0;

        }

        tecnicos[tecnico].hallazgos[hallazgo] += 1;

    });

    return tecnicos;

}


/* ============================================================
   CONVERTIR A ESTRUCTURA PARA LA GRÁFICA
   ============================================================ */

function construirFilasErrores(agrupados) {

    const filas = [];

    Object.entries(agrupados).forEach(function([tecnico, datos]) {

        /* ====================================================
           FILA PRINCIPAL DEL TÉCNICO
           ==================================================== */

        filas.push({

            tipo: 'tecnico',

            tecnico: tecnico,

            label: tecnico,

            total: datos.total

        });


        /* ====================================================
           HALLAZGOS DEL TÉCNICO
           ==================================================== */

        const hallazgos = Object.entries(
            datos.hallazgos
        ).map(function([hallazgo, total]) {

            return {

                hallazgo: hallazgo,

                total: total

            };

        });


        /* ====================================================
           ORDENAR HALLAZGOS DE MAYOR A MENOR
           ==================================================== */

        hallazgos.sort(function(a, b) {

            return b.total - a.total;

        });


        /* ====================================================
           AGREGAR CADA HALLAZGO DEBAJO DEL TÉCNICO
           ==================================================== */

        hallazgos.forEach(function(item) {

            filas.push({

                tipo: 'hallazgo',

                tecnico: tecnico,

                label: '   ↳ ' + item.hallazgo,

                total: item.total

            });

        });

    });


    return filas;

}


/* ============================================================
   ACTUALIZAR GRÁFICA
   ============================================================ */

function actualizarGraficaErroresTecnico() {

    /* ========================================================
       FILTROS
       ======================================================== */

    const anioSeleccionado =
        filtroAnioErroresTecnico.value;

    const mesSeleccionado =
        filtroMesErroresTecnico.value;


    /* ========================================================
       COPIAR DATOS
       ======================================================== */

    let datosFiltrados = [
        ...datosErroresPorTecnicos
    ];


    /* ========================================================
       FILTRO AÑO
       ======================================================== */

    if (
        anioSeleccionado &&
        anioSeleccionado !== 'todos'
    ) {

        datosFiltrados =
            datosFiltrados.filter(function(error) {

                return (

                    error.fecha_operacion &&

                    obtenerAnioError(
                        error.fecha_operacion
                    ) === anioSeleccionado

                );

            });

    }


    /* ========================================================
       FILTRO MES
       ======================================================== */

    if (
        mesSeleccionado &&
        mesSeleccionado !== 'todos'
    ) {

        datosFiltrados =
            datosFiltrados.filter(function(error) {

                return (

                    error.fecha_operacion &&

                    obtenerMesError(
                        error.fecha_operacion
                    ) === mesSeleccionado

                );

            });

    }


    /* ========================================================
       AGRUPAR
       ======================================================== */

    const agrupados =
        agruparErroresPorTecnico(
            datosFiltrados
        );


    /* ========================================================
       ORDENAR TÉCNICOS POR TOTAL
       ======================================================== */

    const tecnicosOrdenados =
        Object.entries(agrupados);

    tecnicosOrdenados.sort(function(a, b) {

        return b[1].total - a[1].total;

    });


    /* ========================================================
       VOLVER A CREAR OBJETO ORDENADO
       ======================================================== */

    const agrupadosOrdenados = {};

    tecnicosOrdenados.forEach(function([tecnico, datos]) {

        agrupadosOrdenados[tecnico] = datos;

    });


    /* ========================================================
       CREAR FILAS
       ======================================================== */

    const filas =
        construirFilasErrores(
            agrupadosOrdenados
        );


    /* ========================================================
       LABELS
       ======================================================== */

    const nombres =
        filas.map(function(fila) {

            return fila.label;

        });


    /* ========================================================
       CANTIDADES
       ======================================================== */

    const cantidades =
        filas.map(function(fila) {

            return fila.total;

        });


    /* ========================================================
       COLORES
       ======================================================== */

    const colores =
        filas.map(function(fila) {

            if (fila.tipo === 'tecnico') {

                return '#ef4444';

            }

            return '#fca5a5';

        });


    /* ========================================================
       TOTAL GENERAL
       ======================================================== */

    const total =
        datosFiltrados.length;


    document.getElementById(
        'totalErroresTecnico'
    ).textContent =
        total.toLocaleString('es-CO');


    /* ========================================================
       TEXTO DEL PERÍODO
       ======================================================== */

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
            nombresMesesErrores[
                mesSeleccionado
            ];

    }

    else {

        textoPeriodo +=

            nombresMesesErrores[
                mesSeleccionado
            ] +

            ' ' +

            anioSeleccionado;

    }


    document.getElementById(
        'periodoErroresTecnico'
    ).textContent =
        textoPeriodo;


    /* ========================================================
       CONTENEDOR
       ======================================================== */

    const contenedor =
        document.getElementById(
            'contenedorGraficaErroresTecnico'
        );


    /*
       Una fila para cada técnico
       + una fila para cada hallazgo
    */

    const alturaPorFila = 38;

    const alturaMinima = 350;


    contenedor.style.height =

        Math.max(

            alturaMinima,

            filas.length *
            alturaPorFila

        ) + 'px';


    /* ========================================================
       DESTRUIR GRÁFICA ANTERIOR
       ======================================================== */

    if (graficaErroresTecnico) {

        graficaErroresTecnico.destroy();

    }


    /* ========================================================
       CANVAS
       ======================================================== */

    const canvas =
        document.getElementById(
            'graficaErroresTecnico'
        );


    /* ========================================================
       CREAR GRÁFICA
       ======================================================== */

    graficaErroresTecnico =

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

                        label: 'Errores',

                        data: cantidades,

                        backgroundColor: colores,

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

                            right: 70

                        }

                    },


                    plugins: {

                        legend: {

                            display: false

                        },


                        /* ====================================
                           NÚMERO AL FINAL DE CADA BARRA
                           ==================================== */

                        datalabels: {

                            anchor: 'end',

                            align: 'end',

                            offset: 5,

                            color: function(context) {

                                const fila =
                                    filas[
                                        context.dataIndex
                                    ];

                                if (
                                    fila.tipo ===
                                    'tecnico'
                                ) {

                                    return '#dc2626';

                                }

                                return '#64748b';

                            },

                            font: function(context) {

                                const fila =
                                    filas[
                                        context.dataIndex
                                    ];

                                return {

                                    size:
                                        fila.tipo ===
                                        'tecnico'
                                            ? 12
                                            : 11,

                                    weight:
                                        fila.tipo ===
                                        'tecnico'
                                            ? '700'
                                            : '500'

                                };

                            },

                            clip: false,

                            formatter: function(value) {

                                return Number(
                                    value
                                ).toLocaleString(
                                    'es-CO'
                                );

                            }

                        },


                        /* ====================================
                           TOOLTIP
                           ==================================== */

                        tooltip: {

                            callbacks: {

                                title: function(context) {

                                    const fila =
                                        filas[
                                            context[0]
                                                .dataIndex
                                        ];

                                    if (
                                        fila.tipo ===
                                        'tecnico'
                                    ) {

                                        return (
                                            fila.tecnico
                                        );

                                    }

                                    return (
                                        fila.tecnico +
                                        ' → ' +
                                        fila.label
                                            .replace(
                                                '   ↳ ',
                                                ''
                                            )
                                    );

                                },

                                label: function(context) {

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


                    /* ========================================
                       ESCALAS
                       ======================================== */

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

                                color: function(context) {

                                    const fila =
                                        filas[
                                            context.index
                                        ];

                                    if (
                                        fila &&
                                        fila.tipo ===
                                        'tecnico'
                                    ) {

                                        return '#1e293b';

                                    }

                                    return '#64748b';

                                },

                                font: function(context) {

                                    const fila =
                                        filas[
                                            context.index
                                        ];

                                    if (
                                        fila &&
                                        fila.tipo ===
                                        'tecnico'
                                    ) {

                                        return {

                                            size: 12,

                                            weight: '700'

                                        };

                                    }

                                    return {

                                        size: 11,

                                        weight: '400'

                                    };

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


/* ============================================================
   EVENTOS
   ============================================================ */

filtroAnioErroresTecnico.addEventListener(

    'change',

    actualizarGraficaErroresTecnico

);


filtroMesErroresTecnico.addEventListener(

    'change',

    actualizarGraficaErroresTecnico

);


/* ============================================================
   CARGAR INICIAL
   ============================================================ */

actualizarGraficaErroresTecnico();