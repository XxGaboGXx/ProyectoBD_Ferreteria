// src/modules/Venta/Pages/ListaVenta.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaCreditCard,
  FaRegCalendarAlt,
  FaRegEdit,
  FaTrashAlt,
  FaSearch,
  FaClipboardCheck,
} from "react-icons/fa";
import { cancelVenta, fetchVentas } from "../Services/ventaService";
import type { Venta } from "../Types/Venta";

const ListaVenta: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchVentas({ page: 1, limit: 30 });
      setVentas(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudieron cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const eliminarVenta = async (id: number) => {
    const ok = confirm(`¿Deseas cancelar la venta #${id}?`);
    if (!ok) return;
    try {
      await cancelVenta(id, 'Cancelada desde la UI');
      alert('Venta cancelada');
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo cancelar la venta');
    }
  };

  return (
    <div className="p-6">
      {/* Encabezado con título y botón alineado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-0">
          💰 Lista de Ventas
        </h1>

        <Link
          to="/ventas/nuevo"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition self-end sm:self-auto"
        >
          ➕ Nueva Venta
        </Link>
      </div>

      {/* Cards de ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && <p>Cargando ventas...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && ventas.map((venta) => (
          <div
            key={venta.Id_venta}
            className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              <FaClipboardCheck className="inline-block text-blue-600 mr-2" />
              Venta #{venta.Id_venta}
            </h3>

            <p className="text-gray-600 flex items-center gap-2">
              <FaRegCalendarAlt className="text-blue-500" />
              <strong>Fecha:</strong> {venta.Fecha}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaMoneyBillWave className="text-green-600" />
              <strong>Total:</strong> ${Number(venta.TotalVenta ?? 0).toFixed(2)}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaCreditCard className="text-purple-600" />
              <strong>Método:</strong> {venta.MetodoPago}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <FaClipboardCheck
                className={`${
                  venta.Estado === "Completada"
                    ? "text-green-600"
                    : "text-yellow-500"
                }`}
              />
              <strong>Estado:</strong> {venta.Estado}
            </p>

            {/* Botones de acción */}
            <div className="mt-4 flex justify-between">
              <Link
                to={`/ventas/${venta.Id_venta}`}
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <FaSearch /> Ver Detalle
              </Link>

              <div className="flex gap-3">
                <Link
                  to={`/ventas/${venta.Id_venta}/editar`}
                  className="flex items-center gap-1 text-green-600 hover:underline"
                >
                  <FaRegEdit /> Editar
                </Link>

                <button
                  onClick={() => eliminarVenta(venta.Id_venta)}
                  className="flex items-center gap-1 text-red-600 hover:underline"
                >
                  <FaTrashAlt /> Cancelar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaVenta;
