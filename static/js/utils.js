
// ============================================================
// CONFIGURACIÓN GENERAL
// ============================================================

Chart.register(ChartDataLabels);


// ============================================================
// FUNCIONES GENERALES
// ============================================================

function numero(valor) {

    return Number(valor || 0);

}


function formatearNumero(valor) {

    return numero(valor).toLocaleString('es-CO');

}


function formatearFecha(fecha) {

    if (!fecha) {
        return '';
    }

    const partes = fecha.split('-');

    if (partes.length !== 3) {
        return fecha;
    }

    return (
        partes[2] +
        '/' +
        partes[1] +
        '/' +
        partes[0]
    );

}


function obtenerAnio(fecha) {

    return fecha.split('-')[0];

}


function obtenerMes(fecha) {

    return fecha.split('-')[1];

}


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