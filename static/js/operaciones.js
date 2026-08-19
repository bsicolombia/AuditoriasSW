const elementoDatosOperaciones =
    document.getElementById('datos-operaciones');

if (elementoDatosOperaciones) {

    const datosOperaciones =
        JSON.parse(elementoDatosOperaciones.textContent);

    const ctxOperaciones =
        document.getElementById('graficaAuditorias');

    if (ctxOperaciones) {

        new Chart(ctxOperaciones, {

            type: 'bar',

            plugins: [
                ChartDataLabels
            ],

            data: {

                labels: [
                    'Suspensiones',
                    'Reconexiones',
                    'ZVCL'
                ],

                datasets: [{

                    label: 'Auditorías',

                    data: [
                        numero(datosOperaciones.Suspensiones),
                        numero(datosOperaciones.Reconexiones),
                        numero(datosOperaciones.Zvcl)
                    ],

                    backgroundColor: [
                        '#ef4444',
                        '#22c55e',
                        '#3b82f6'
                    ],

                    borderRadius: 7,

                    borderSkipped: false,

                    barThickness: 45,

                    maxBarThickness: 45

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                layout: {

                    padding: {
                        top: 25,
                        right: 15,
                        left: 10,
                        bottom: 5
                    }

                },

                plugins: {

                    legend: {
                        display: false
                    },

                    datalabels: {

                        anchor: 'end',

                        align: 'top',

                        offset: 5,

                        color: '#1e293b',

                        clip: false,

                        font: {

                            size: 14,

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
                                    ' Auditorías: ' +
                                    formatearNumero(context.parsed.y)
                                );

                            }

                        }

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        grace: '15%',

                        ticks: {

                            color: '#64748b',

                            font: {
                                size: 11
                            }

                        },

                        grid: {

                            color: '#e2e8f0'

                        }

                    },

                    x: {

                        ticks: {

                            color: '#334155',

                            font: {

                                size: 12,

                                weight: '600'

                            }

                        },

                        grid: {

                            display: false

                        }

                    }

                }

            }

        });

    }
}
