// src/modules/Alquiler/Pages/ListaAlquiler.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUser,
  FaUserTie,
  FaClipboardCheck,
  // FaRegEdit,
  // FaTrashAlt,
  FaSearch,
} from "react-icons/fa";
import { fetchAlquileres, finalizarAlquiler, cancelarAlquiler, extenderAlquiler } from "../Services/alquilerService";
import type { Alquiler } from "../Types/Alquiler";

const ListaAlquiler: React.FC = () => {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const resp = await fetchAlquileres({ page: 1, limit: 30 });
      setAlquileres(resp.data);
    } catch (e: any) {
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
      await cargar();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'No se pudo finalizar');
    }
  };

  const handleCancelar = async (id: number) => {
    const motivo = window.prompt('Motivo de cancelación:');
    if (!motivo) return;
    try {
      await cancelarAlquiler(id, motivo);
      await cargar();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'No se pudo cancelar');
    }
  };

  const handleExtender = async (id: number) => {
    const dias = window.prompt('¿Cuántos días adicionales?');
    const n = Number(dias);
    if (!dias || isNaN(n) || n <= 0) return;
    try {
      await extenderAlquiler(id, n);
      await cargar();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'No se pudo extender');
    }
  };

  return (
    <div className="p-6">
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
        {!loading && !error && alquileres.map((alquiler) => (
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
                  alquiler.Estado === "Activo"
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
              <FaUser className="text-gray-600" />
              <strong>Cliente (ID):</strong> {alquiler.Id_cliente}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaUserTie className="text-gray-600" />
              <strong>Colaborador (ID):</strong> {alquiler.Id_colaborador}
            </p>

            {/* Botones de acción */}
            <div className="mt-4 flex justify-between">
              <Link
                to={`/alquileres/${alquiler.Id_alquiler}`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <FaSearch /> Ver Detalle
              </Link>

              <div className="flex gap-3 text-sm">
                <button onClick={() => handleFinalizar(alquiler.Id_alquiler)} className="text-green-600 hover:underline">Finalizar</button>
                <button onClick={() => handleExtender(alquiler.Id_alquiler)} className="text-yellow-600 hover:underline">Extender</button>
                <button onClick={() => handleCancelar(alquiler.Id_alquiler)} className="text-red-600 hover:underline">Cancelar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaAlquiler;
