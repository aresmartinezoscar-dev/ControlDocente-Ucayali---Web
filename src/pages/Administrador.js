import React from 'react';
import { importService } from '../services/importService';
import './Administrador.css';

export default function Administrador() {
  const handleImportar = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    try {
      const resultado = await importService.importarDesdeExcel(archivo);
      alert(`Importación completa!\n
Provincias: ${resultado.resumen.provinciasCargadas}
Escuelas: ${resultado.resumen.escuelasCargadas}
Profesores: ${resultado.resumen.profesoresCargados}
Errores: ${resultado.resumen.errores}`);
    } catch (error) {
      alert('Error en importación: ' + error.message);
    }
  };

  return (
    <div className="admin-page">
      <h1>Panel de Administrador</h1>
      
      <div className="admin-section">
        <h2>Importar Datos</h2>
        <p>Importa profesores, escuelas y provincias desde Excel</p>
        
        <button onClick={() => importService.generarPlantilla()}>
          📥 Descargar Plantilla Excel
        </button>
        
        <div className="file-input-wrapper">
          <label htmlFor="file-upload" className="file-input-label">
            📤 Importar Excel
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportar}
            style={{ display: 'none' }}
          />
        </div>

        <div className="formato-info">
          <h3>Formato del Excel:</h3>
          <ul>
            <li><strong>Columna A:</strong> Provincia (CORONEL PORTILLO, PADRE ABAD, ATALAYA, PURUS)</li>
            <li><strong>Columna B:</strong> Nombre de la Escuela</li>
            <li><strong>Columna C:</strong> Latitud (-8.3791)</li>
            <li><strong>Columna D:</strong> Longitud (-74.5539)</li>
            <li><strong>Columna E:</strong> Nombre del Profesor</li>
            <li><strong>Columna F:</strong> Correo del Profesor</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
