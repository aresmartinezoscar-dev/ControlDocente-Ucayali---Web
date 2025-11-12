import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { exportService } from '../services/exportService';
import './Reportes.css';

export default function Reportes() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      const q = query(
        collection(db, 'incidenciasReportadas'),
        where('resuelto', '==', false)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReportes(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolverIncidencia = async (reporte) => {
    if (window.confirm(`¿Resolver incidencia de ${reporte.profesorNombre}?`)) {
      try {
        await deleteDoc(doc(db, 'incidenciasReportadas', reporte.id));
        alert('Incidencia resuelta');
        cargarReportes();
      } catch (error) {
        alert('Error al resolver');
      }
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return 'N/A';
    const fecha = typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate();
    return fecha.toLocaleString('es-PE');
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="reportes-page">
      <div className="page-header">
        <h1>Reportes de Incidencias</h1>
        <button onClick={() => exportService.exportarReportes(reportes)}>
          📥 Exportar
        </button>
      </div>

      {reportes.length === 0 ? (
        <div className="sin-reportes">✅ No hay incidencias pendientes</div>
      ) : (
        <table className="tabla-reportes">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Profesor</th>
              <th>Escuela</th>
              <th>Tipo</th>
              <th>Distancia</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {reportes.map(r => (
              <tr key={r.id}>
                <td>{formatearFecha(r.timestamp)}</td>
                <td>{r.profesorNombre}</td>
                <td>{r.escuelaNombre}</td>
                <td>{r.tipo}</td>
                <td>{r.distanciaMetros}m</td>
                <td>
                  <button onClick={() => resolverIncidencia(r)}>
                    Aceptar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
