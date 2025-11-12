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
    const distritos = new Map();
    const escuelas = new Map();
    const profesores = [];
    let errores = [];

    // Saltar fila de encabezados
    for (let i = 1; i < data.length; i++) {
      const fila = data[i];
      
      if (!fila || fila.length < 8) {
        errores.push(`Fila ${i + 1}: Datos incompletos`);
        continue;
      }

      const [
        provinciaNombre,
        distritoNombre,
        escuelaNombre,
        latitud,
        longitud,
        profesorNombre,
        profesorCorreo,
        identificador
      ] = fila;

      try {
        // Validaciones
        if (!provinciaNombre || !distritoNombre || !escuelaNombre || !profesorNombre || !profesorCorreo || !identificador) {
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

        if (String(identificador).length !== 8 || isNaN(identificador)) {
          errores.push(`Fila ${i + 1}: Identificador debe ser 8 números`);
          continue;
        }

        // Normalizar nombres
        const provinciaNormalizada = provinciaNombre.trim().toUpperCase();
        const distritoNormalizado = distritoNombre.trim();
        const provinciaId = this.normalizarId(provinciaNormalizada);
        const distritoId = this.normalizarId(`${provinciaId}-${distritoNormalizado}`);

        // Guardar provincia
        if (!provincias.has(provinciaId)) {
          provincias.set(provinciaId, {
            id: provinciaId,
            nombre: provinciaNormalizada
          });
        }

        // Guardar distrito
        if (!distritos.has(distritoId)) {
          distritos.set(distritoId, {
            id: distritoId,
            nombre: distritoNormalizado,
            provinciaId: provinciaId,
            provinciaNombre: provinciaNormalizada
          });
        }

        // Guardar escuela
        const escuelaId = this.normalizarId(`${distritoId}-${escuelaNombre}`);
        if (!escuelas.has(escuelaId)) {
          escuelas.set(escuelaId, {
            id: escuelaId,
            nombre: escuelaNombre.trim(),
            distritoId: distritoId,
            distritoNombre: distritoNormalizado,
            provinciaId: provinciaId,
            provinciaNombre: provinciaNormalizada,
            coordenadas: {
              latitud: parseFloat(latitud),
              longitud: parseFloat(longitud),
              radio: 80
            }
          });
        }

        // Guardar profesor
        profesores.push({
          id: this.normalizarId(profesorCorreo),
          nombre: profesorNombre.trim(),
          email: profesorCorreo.trim().toLowerCase(),
          identificador: String(identificador),
          escuelaId: escuelaId,
          escuelaNombre: escuelaNombre.trim(),
          distritoId: distritoId,
          distritoNombre: distritoNormalizado,
          provinciaId: provinciaId,
          provinciaNombre: provinciaNormalizada,
          activo: true,
          fotoReferencia: null // Se sube después manualmente
        });

      } catch (error) {
        errores.push(`Fila ${i + 1}: ${error.message}`);
      }
    }

    // Guardar en Firestore
    let provinciasCargadas = 0;
    let distritosCargados = 0;
    let escuelasCargadas = 0;
    let profesoresCargados = 0;

    // Provincias
    for (const [id, provincia] of provincias) {
      try {
        await setDoc(doc(db, 'provincias', id), {
          ...provincia,
          createdAt: serverTimestamp()
        });
        provinciasCargadas++;
      } catch (error) {
        errores.push(`Error provincia ${provincia.nombre}: ${error.message}`);
      }
    }

    // Distritos
    for (const [id, distrito] of distritos) {
      try {
        await setDoc(doc(db, 'distritos', id), {
          ...distrito,
          createdAt: serverTimestamp()
        });
        distritosCargados++;
      } catch (error) {
        errores.push(`Error distrito ${distrito.nombre}: ${error.message}`);
      }
    }

    // Escuelas
    for (const [id, escuela] of escuelas) {
      try {
        await setDoc(doc(db, 'escuelas', id), {
          ...escuela,
          createdAt: serverTimestamp()
        });
        escuelasCargadas++;
      } catch (error) {
        errores.push(`Error escuela ${escuela.nombre}: ${error.message}`);
      }
    }

    // Profesores
    for (const profesor of profesores) {
      try {
        await setDoc(doc(db, 'profesores', profesor.id), {
          ...profesor,
          createdAt: serverTimestamp()
        });
        profesoresCargados++;
      } catch (error) {
        errores.push(`Error profesor ${profesor.nombre}: ${error.message}`);
      }
    }

    return {
      exito: true,
      resumen: {
        provinciasCargadas,
        distritosCargados,
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
      ['provincia', 'distrito', 'nombreEscuela', 'latitudEscuela', 'longitudEscuela', 'nombreProfesor', 'correoProfesor', 'identificador'],
      ['CORONEL PORTILLO', 'Callería', 'I.E. San Juan Bautista', -8.3791, -74.5539, 'Juan Pérez García', 'juan.perez@email.com', '12345678'],
      ['CORONEL PORTILLO', 'Callería', 'I.E. San Juan Bautista', -8.3791, -74.5539, 'María López Torres', 'maria.lopez@email.com', '87654321'],
      ['CORONEL PORTILLO', 'Yarinacocha', 'I.E. José Olaya', -8.3502, -74.5726, 'Carlos Ramírez Díaz', 'carlos.ramirez@email.com', '11223344'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(datos);
    
    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 18 }, // provincia
      { wch: 15 }, // distrito
      { wch: 25 }, // nombreEscuela
      { wch: 15 }, // latitud
      { wch: 15 }, // longitud
      { wch: 25 }, // nombreProfesor
      { wch: 30 }, // correoProfesor
      { wch: 12 }  // identificador
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profesores');
    
    XLSX.writeFile(wb, 'plantilla_controldocente_ucayali.xlsx');
  }
};

export default importService;
