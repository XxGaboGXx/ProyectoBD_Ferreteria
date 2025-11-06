// src/modules/Alquiler/Pages/ListaAlquiler.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUser,
  FaClipboardCheck,
  FaSearch,
} from "react-icons/fa";
import { fetchAlquileres, finalizarAlquiler, cancelarAlquiler, extenderAlquiler } from "../Services/alquilerService";
import { fetchClientes } from "../../Cliente/Services/clienteService";
import type { Alquiler } from "../Types/Alquiler";
import type { Cliente } from "../../Cliente/Types/Cliente";
import { useToast } from "../../../hooks/useToast";
import { ToastContainer } from "../../../hooks/ToastContainer";

const ListaAlquiler: React.FC = () => {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  const cargar = async () => {
    try {
      setLoading(true);
      const [alqRes, cliRes] = await Promise.all([
        fetchAlquileres({ page: 1, limit: 30 }),
        fetchClientes()
      ]);
      setAlquileres(alqRes.data);
      
      // Validar y convertir a arrays de forma segura
      const clientesArray = Array.isArray(cliRes) ? cliRes : (Array.isArray(cliRes?.data) ? cliRes.data : []);
      setClientes(clientesArray);
      
      console.log('📊 Datos cargados:', {
        alquileres: alqRes.data?.length,
        clientes: clientesArray.length,
        clientesEsArray: Array.isArray(clientesArray)
      });
    } catch (e: any) {
      console.error('❌ Error al cargar:', e);
      setError(e?.message || 'Error al cargar alquileres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleFinalizar = async (id: number) => {
    if (!window.confirm(`¿Finalizar el alquiler #${id}?`)) return;
    try {
      await finalizarAlquiler(id);
      showToast(`✅ Alquiler #${id} finalizado exitosamente`, 'success');
      await cargar();
    } catch (e: any) {
      showToast(e?.response?.data?.message || e?.message || 'No se pudo finalizar', 'error');
    }
  };

  const handleCancelar = async (id: number) => {
    const motivo = window.prompt('Motivo de cancelación:');
    if (!motivo || motivo.trim() === '') {
      showToast('⚠️ Debe ingresar un motivo de cancelación', 'warning');
      return;
    }
    try {
      console.log('📤 Cancelando alquiler:', { id, motivo });
      await cancelarAlquiler(id, motivo.trim());
      showToast(`✅ Alquiler #${id} cancelado exitosamente`, 'success');
      await cargar();
    } catch (e: any) {
      console.error('❌ Error al cancelar:', e);
      showToast(e?.response?.data?.message || e?.message || 'No se pudo cancelar', 'error');
    }
  };

  const handleExtender = async (id: number) => {
    const dias = window.prompt('¿Cuántos días adicionales?');
    if (!dias || dias.trim() === '') {
      showToast('⚠️ Operación cancelada', 'warning');
      return;
    }
    const n = Number(dias);
    if (isNaN(n) || n <= 0) {
      showToast('⚠️ Debe ingresar un número válido de días', 'warning');
      return;
    }
    try {
      console.log('📤 Extendiendo alquiler:', { id, dias: n });
      await extenderAlquiler(id, n);
      showToast(`✅ Alquiler #${id} extendido por ${n} días`, 'success');
      await cargar();
    } catch (e: any) {
      console.error('❌ Error al extender:', e);
      showToast(e?.response?.data?.message || e?.message || 'No se pudo extender', 'error');
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Encabezado con botón alineado a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          📤 Lista de Alquileres
        </h1>

        <Link
          to="/alquileres/nuevo"
          className="mt-4 sm:mt-0 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          ➕ Nuevo Alquiler
        </Link>
      </div>

      {loading && <p className="text-gray-600">Cargando alquileres...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Cards de alquileres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && !error && alquileres.map((alquiler) => {
          const cliente = Array.isArray(clientes) && clientes.length > 0 
            ? clientes.find(c => c.Id_cliente === alquiler.Id_cliente) 
            : null;
          const nombreCliente = cliente ? `${cliente.Nombre} ${cliente.Apellido1} ${cliente.Apellido2 || ''}`.trim() : `Cliente #${alquiler.Id_cliente}`;
          
          return (
            <div
              key={alquiler.Id_alquiler}
              className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                <FaClipboardCheck className="inline-block text-blue-600 mr-2" />
                Alquiler #{alquiler.Id_alquiler}
              </h3>

              <p className="text-gray-600 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-500" />
                <strong>Inicio:</strong> {new Date(alquiler.FechaInicio).toLocaleString()}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <FaCalendarAlt className="text-red-500" />
                <strong>Fin:</strong> {alquiler.FechaFin ? new Date(alquiler.FechaFin).toLocaleString() : '—'}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <FaClipboardCheck
                  className={`${
                    alquiler.Estado === "ACTIVO"
                      ? "text-green-600"
                      : "text-yellow-500"
                  }`}
                />
                <strong>Estado:</strong> {alquiler.Estado}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <span className="text-green-600">💰</span>
                <strong>Total:</strong> ${Number(alquiler.TotalAlquiler || 0).toFixed(2)}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <FaUser className="text-blue-600" />
                <strong>Cliente:</strong> {nombreCliente}
              </p>

              {/* Botones de acción */}
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  to={`/alquileres/${alquiler.Id_alquiler}`}
                  className="flex items-center justify-center gap-1 text-blue-600 hover:underline font-semibold"
                >
                  <FaSearch /> Ver Detalle
                </Link>

                <div className="flex gap-2 text-sm justify-center">
                  <button 
                    onClick={() => handleFinalizar(alquiler.Id_alquiler)} 
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                  >
                    Finalizar
                  </button>
                  <button 
                    onClick={() => handleExtender(alquiler.Id_alquiler)} 
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition"
                  >
                    Extender
                  </button>
                  <button 
                    onClick={() => handleCancelar(alquiler.Id_alquiler)} 
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListaAlquiler;
