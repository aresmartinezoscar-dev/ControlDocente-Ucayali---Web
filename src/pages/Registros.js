import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { exportService } from '../services/exportService';
import './Registros.css';

export default function Registros() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarRegistros();
  }, []);

  const cargarRegistros = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'registros'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegistros(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return 'N/A';
    const fecha = typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate();
    return fecha.toLocaleString('es-PE');
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="registros-page">
      <div className="page-header">
        <h1>Todos los Registros</h1>
        <button onClick={() => exportService.exportarRegistros(registros)}>
          📥 Exportar
        </button>
      </div>

      <table className="tabla-registros">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Profesor</th>
            <th>Escuela</th>
            <th>Tipo</th>
            <th>Perímetro</th>
            <th>Timestamp Confiable</th>
          </tr>
        </thead>
        <tbody>
          {registros.map(r => (
            <tr key={r.id}>
              <td>{formatearFecha(r.timestamp)}</td>
              <td>{r.profesorNombre}</td>
              <td>{r.escuelaNombre}</td>
              <td>{r.tipo}</td>
              <td>{r.dentroPerimetro ? '✅' : '❌'}</td>
              <td>{r.timestampConfiable !== false ? '✅' : '⚠️'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
