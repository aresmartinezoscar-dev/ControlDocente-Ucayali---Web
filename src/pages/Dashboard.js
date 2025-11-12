import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProfesores: 0,
    totalEscuelas: 0,
    registrosHoy: 0,
    incidenciasPendientes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const profesoresSnap = await getDocs(collection(db, 'profesores'));
      const escuelasSnap = await getDocs(collection(db, 'escuelas'));
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const qHoy = query(
        collection(db, 'registros'),
        where('timestamp', '>=', hoy.toISOString())
      );
      const registrosHoySnap = await getDocs(qHoy);
      
      const qIncidencias = query(
        collection(db, 'incidenciasReportadas'),
        where('resuelto', '==', false)
      );
      const incidenciasSnap = await getDocs(qIncidencias);

      setStats({
        totalProfesores: profesoresSnap.size,
        totalEscuelas: escuelasSnap.size,
        registrosHoy: registrosHoySnap.size,
        incidenciasPendientes: incidenciasSnap.size
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalProfesores}</div>
            <div className="stat-label">Profesores</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalEscuelas}</div>
            <div className="stat-label">Escuelas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.registrosHoy}</div>
            <div className="stat-label">Registros Hoy</div>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.incidenciasPendientes}</div>
            <div className="stat-label">Incidencias</div>
          </div>
        </div>
      </div>
    </div>
  );
}
