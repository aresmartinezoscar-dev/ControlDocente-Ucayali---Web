import * as XLSX from 'xlsx';

export const exportService = {
  exportarRegistros(registros, nombreArchivo = 'registros_controldocente') {
    const datos = registros.map(registro => ({
      'Fecha': this.formatearFecha(registro.timestamp),
      'Hora': this.formatearHora(registro.timestamp),
      'Profesor': registro.profesorNombre,
      'Correo': registro.profesorCorreo,
      'Escuela': registro.escuelaNombre,
      'Provincia': registro.provinciaId?.toUpperCase() || 'N/A',
      'Tipo': registro.tipo.toUpperCase(),
      'Latitud': registro.ubicacion?.latitud || 'N/A',
      'Longitud': registro.ubicacion?.longitud || 'N/A',
      'Dentro del Perímetro': registro.dentroPerimetro ? 'SÍ' : 'NO',
      'Distancia (metros)': registro.distanciaMetros || 'N/A',
      'Timestamp Confiable': registro.timestampConfiable ? 'SÍ' : 'NO',
      'Sincronizado': registro.sincronizado ? 'SÍ' : 'NO'
    }));

    this.descargarExcel(datos, nombreArchivo);
  },

  exportarReportes(reportes, nombreArchivo = 'reportes_incidencias') {
    const datos = reportes.map(reporte => ({
      'Fecha': this.formatearFecha(reporte.timestamp),
      'Hora': this.formatearHora(reporte.timestamp),
      'Profesor': reporte.profesorNombre,
      'Correo': reporte.profesorCorreo,
      'Escuela': reporte.escuelaNombre,
      'Provincia': reporte.provinciaId?.toUpperCase() || 'N/A',
      'Tipo': reporte.tipo.toUpperCase(),
      'Distancia (metros)': reporte.distanciaMetros,
      'Latitud': reporte.ubicacion?.latitud || 'N/A',
      'Longitud': reporte.ubicacion?.longitud || 'N/A',
      'Estado': reporte.resuelto ? 'RESUELTO' : 'PENDIENTE'
    }));

    this.descargarExcel(datos, nombreArchivo);
  },

  descargarExcel(datos, nombreArchivo) {
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    const columnas = Object.keys(datos[0] || {});
    ws['!cols'] = columnas.map(() => ({ wch: 20 }));

    XLSX.writeFile(wb, `${nombreArchivo}_${this.formatearFechaArchivo(new Date())}.xlsx`);
  },

  formatearFecha(timestamp) {
    if (!timestamp) return 'N/A';
    const fecha = typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate();
    return fecha.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  },

  formatearHora(timestamp) {
    if (!timestamp) return 'N/A';
    const fecha = typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate();
    return fecha.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  formatearFechaArchivo(fecha) {
    return fecha.toISOString().split('T')[0];
  }
};

export default exportService;
