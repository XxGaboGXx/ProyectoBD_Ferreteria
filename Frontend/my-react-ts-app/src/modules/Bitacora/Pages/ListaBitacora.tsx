// src/modules/Bitacora/Pages/ListaBitacora.tsx
import React, { useEffect, useState } from 'react';
import { fetchBitacoraByProducto } from '../Services/bitacoraService';
import type { BitacoraEntry } from '../Types/Bitacora';

const ListaBitacora: React.FC = () => {
  const [productoId, setProductoId] = useState<string>('');
  const [registros, setRegistros] = useState<BitacoraEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = async () => {
    if (!productoId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBitacoraByProducto(Number(productoId));
      setRegistros(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al cargar bitácora');
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // No cargar nada por defecto; el usuario ingresa un Id de producto
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Bitácora de Productos</h1>

      <div className="bg-white p-4 rounded-xl shadow border mb-4 flex items-end gap-3 max-w-xl">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">ID de Producto</label>
          <input
            type="number"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ingresa el ID de producto"
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
          />
        </div>
        <button
          onClick={buscar}
          disabled={!productoId || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300 hover:bg-blue-700 transition"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="py-2 px-3 text-left">#</th>
              <th className="py-2 px-3 text-left">Tabla</th>
              <th className="py-2 px-3 text-left">Acción</th>
              <th className="py-2 px-3 text-left">Fecha</th>
              <th className="py-2 px-3 text-left">Hora</th>
              <th className="py-2 px-3 text-left">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">Sin resultados</td>
              </tr>
            )}
            {registros.map((r) => (
              <tr key={r.Id_bitacora} className="border-t">
                <td className="py-2 px-3">{r.Id_bitacora}</td>
                <td className="py-2 px-3">{r.TablaAfectada}</td>
                <td className="py-2 px-3">{r.Accion}</td>
                <td className="py-2 px-3">{r.Fecha}</td>
                <td className="py-2 px-3">{r.Hora}</td>
                <td className="py-2 px-3 max-w-xl whitespace-pre-wrap">{r.Descripcion || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Nota: Actualmente el backend expone la bitácora a nivel de producto mediante el endpoint
        <code className="mx-1">/productos/:id/movimientos</code>. Si se agrega un endpoint general de
        bitácora, podremos listar todos los registros con filtros globales.
      </p>
    </div>
  );
};

export default ListaBitacora;
