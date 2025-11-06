// src/modules/Alquiler/Pages/DetalleAlquiler.tsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { fetchAlquilerById, finalizarAlquiler, cancelarAlquiler, extenderAlquiler } from "../Services/alquilerService";

const DetalleAlquiler: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [alquiler, setAlquiler] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await fetchAlquilerById(Number(id));
      setAlquiler(data);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar el alquiler');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) cargar(); }, [id]);

  const onFinalizar = async () => {
    if (!alquiler) return;
    if (!window.confirm(`¿Finalizar el alquiler #${alquiler.Id_alquiler || alquiler.alquilerId || id}?`)) return;
    try {
      await finalizarAlquiler(Number(id));
      await cargar();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'No se pudo finalizar');
    }
  };

  const onCancelar = async () => {
    const motivo = window.prompt('Motivo de cancelación:');
    if (!motivo) return;
    try {
      await cancelarAlquiler(Number(id), motivo);
      await cargar();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'No se pudo cancelar');
    }
  };

  const onExtender = async () => {
    const dias = window.prompt('¿Cuántos días adicionales?');
    const n = Number(dias);
    if (!dias || isNaN(n) || n <= 0) return;
    try {
      await extenderAlquiler(Number(id), n);
      await cargar();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'No se pudo extender');
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!alquiler) return <div className="p-6">No se encontró el alquiler.</div>;

  const cab = alquiler?.compra ? alquiler.compra : alquiler; // por consistencia de forma
  const detalles = Array.isArray(alquiler?.detalles) ? alquiler.detalles : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl border border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          🔍 Detalle del Alquiler
        </h1>

        <div className="space-y-3 text-gray-700">
          <h2 className="text-xl font-bold text-gray-900">Alquiler #{cab.Id_alquiler}</h2>
          <p><strong>Fecha Inicio:</strong> {new Date(cab.FechaInicio).toLocaleString()}</p>
          <p><strong>Fecha Fin:</strong> {cab.FechaFin ? new Date(cab.FechaFin).toLocaleString() : '—'}</p>
          <p><strong>Estado:</strong> {cab.Estado}</p>
          <p><strong>Total:</strong> ${Number(cab.TotalAlquiler || 0).toFixed(2)}</p>
          <p><strong>Cliente (ID):</strong> {cab.Id_cliente}</p>
          <p><strong>Colaborador (ID):</strong> {cab.Id_colaborador}</p>
        </div>

        {detalles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Productos</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-600">
                    <th className="py-2 pr-4 text-left">Producto</th>
                    <th className="py-2 pr-4 text-left">Cantidad</th>
                    <th className="py-2 pr-4 text-left">Días</th>
                    <th className="py-2 pr-4 text-left">Tarifa Diaria</th>
                    <th className="py-2 pr-4 text-left">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((d: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-4">{d.NombreProducto ?? d.Id_producto}</td>
                      <td className="py-2 pr-4">{d.Cantidad}</td>
                      <td className="py-2 pr-4">{d.Dias}</td>
                      <td className="py-2 pr-4">${Number(d.TarifaDiaria || 0).toFixed(2)}</td>
                      <td className="py-2 pr-4">${Number(d.Subtotal || (d.Cantidad * d.Dias * d.TarifaDiaria)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="mt-8 flex flex-wrap gap-3 justify-between">
          <Link
            to="/alquileres"
            className="flex items-center gap-2 px-5 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
          >
            <FaArrowLeft /> Volver
          </Link>

          <div className="flex gap-3">
            <button onClick={onFinalizar} className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">Finalizar</button>
            <button onClick={onExtender} className="px-5 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Extender</button>
            <button onClick={onCancelar} className="px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleAlquiler;
