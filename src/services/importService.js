import { db } from './firebase';
import { collection, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export const importService = {
  async importarDesdeExcel(archivo) {
    try {
      const data = await this.leerArchivoExcel(archivo);
      const resultado = await this.procesarDatos(data);
      return resultado;
    } catch (error) {
      console.error('Error importando Excel:', error);
      throw error;
    }
  },

  async leerArchivoExcel(archivo) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsBinaryString(archivo);
    });
  },

  async procesarDatos(data) {
    const provincias = new Map();
    const escuelas = new Map();
    const profesores = [];
    let errores = [];

    for (let i = 1; i < data.length; i++) {
      const fila = data[i];
      
      if (!fila || fila.length < 6) {
        errores.push(`Fila ${i + 1}: Datos incompletos`);
        continue;
      }

      const [
        provinciaNombre,
        escuelaNombre,
        latitud,
        longitud,
        profesorNombre,
        profesorCorreo
      ] = fila;

      try {
        if (!provinciaNombre || !escuelaNombre || !profesorNombre || !profesorCorreo) {
          errores.push(`Fila ${i + 1}: Faltan datos obligatorios`);
          continue;
        }

        if (!this.validarEmail(profesorCorreo)) {
          errores.push(`Fila ${i + 1}: Email inválido - ${profesorCorreo}`);
          continue;
        }

        if (isNaN(latitud) || isNaN(longitud)) {
          errores.push(`Fila ${i + 1}: Coordenadas inválidas`);
          continue;
        }

        const provinciaNormalizada = provinciaNombre.trim().toUpperCase();
        const provinciaId = this.normalizarId(provinciaNormalizada);

        if (!provincias.has(provinciaId)) {
          provincias.set(provinciaId, {
            id: provinciaId,
            nombre: provinciaNormalizada
          });
        }

        const escuelaId = this.normalizarId(`${provinciaId}-${escuelaNombre}`);

        if (!escuelas.has(escuelaId)) {
          escuelas.set(escuelaId, {
            id: escuelaId,
            nombre: escuelaNombre.trim(),
            provinciaId: provinciaId,
            provinciaNombre: provinciaNormalizada,
            coordenadas: {
              latitud: parseFloat(latitud),
              longitud: parseFloat(longitud),
              radio: 80
            }
          });
        }

        profesores.push({
          nombre: profesorNombre.trim(),
          email: profesorCorreo.trim().toLowerCase(),
          escuelaId: escuelaId,
          escuelaNombre: escuelaNombre.trim(),
          provinciaId: provinciaId,
          provinciaNombre: provinciaNormalizada,
          activo: true
        });

      } catch (error) {
        errores.push(`Fila ${i + 1}: ${error.message}`);
      }
    }

    let provinciasCargadas = 0;
    let escuelasCargadas = 0;
    let profesoresCargados = 0;

    for (const [id, provincia] of provincias) {
      try {
        await setDoc(doc(db, 'provincias', id), {
          ...provincia,
          createdAt: serverTimestamp()
        });
        provinciasCargadas++;
      } catch (error) {
        errores.push(`Error guardando provincia ${provincia.nombre}: ${error.message}`);
      }
    }

    for (const [id, escuela] of escuelas) {
      try {
        await setDoc(doc(db, 'escuelas', id), {
          ...escuela,
          createdAt: serverTimestamp()
        });
        escuelasCargadas++;
      } catch (error) {
        errores.push(`Error guardando escuela ${escuela.nombre}: ${error.message}`);
      }
    }

    for (const profesor of profesores) {
      try {
        const profesorId = this.normalizarId(profesor.email);
        await setDoc(doc(db, 'profesores', profesorId), {
          ...profesor,
          createdAt: serverTimestamp()
        });
        profesoresCargados++;
      } catch (error) {
        errores.push(`Error guardando profesor ${profesor.nombre}: ${error.message}`);
      }
    }

    return {
      exito: true,
      resumen: {
        provinciasCargadas,
        escuelasCargadas,
        profesoresCargados,
        errores: errores.length
      },
      errores
    };
  },

  validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  normalizarId(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  },

  generarPlantilla() {
    const datos = [
      ['provincia', 'nombreEscuela', 'latitudEscuela', 'longitudEscuela', 'nombreProfesor', 'correoProfesor'],
      ['CORONEL PORTILLO', 'I.E. San Juan Bautista', '-8.3791', '-74.5539', 'Juan Pérez García', 'juan.perez@email.com'],
      ['CORONEL PORTILLO', 'I.E. San Juan Bautista', '-8.3791', '-74.5539', 'María López Torres', 'maria.lopez@email.com'],
      ['PADRE ABAD', 'I.E. José Carlos Mariátegui', '-8.8543', '-75.5122', 'Carlos Ramírez Díaz', 'carlos.ramirez@email.com'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profesores');
    
    XLSX.writeFile(wb, 'plantilla_profesores_controldocente.xlsx');
  }
};

export default importService;
