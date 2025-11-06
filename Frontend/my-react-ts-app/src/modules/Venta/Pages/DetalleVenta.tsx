// src/modules/Venta/Pages/DetalleVenta.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cancelVenta, fetchDetallesVenta, fetchVentaById } from '../Services/ventaService';

const DetalleVenta: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState<any>(null);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [v, d] = await Promise.all([
        fetchVentaById(Number(id)),
        fetchDetallesVenta(Number(id))
      ]);
      setVenta(v);
      setDetalles(d);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo cargar la venta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    const ok = confirm('¿Deseas cancelar esta venta?');
    if (!ok) return;
    try {
      await cancelVenta(Number(id), 'Cancelada desde detalle');
      alert('Venta cancelada');
      navigate('/ventas');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo cancelar');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🔍 Detalle de la Venta</h1>
      
      <div className="border p-4 rounded shadow max-w-md mx-auto">
        {loading && <p>Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && venta && (
          <>
            <h2 className="text-xl font-bold">Venta #{venta.Id_venta}</h2>
            <p><strong>Fecha:</strong> {venta.Fecha}</p>
            <p><strong>Total:</strong> ${Number(venta.TotalVenta ?? 0).toFixed(2)}</p>
            <p><strong>Método de Pago:</strong> {venta.MetodoPago}</p>
            <p><strong>Estado:</strong> {venta.Estado}</p>
            <p><strong>Cliente:</strong> {venta.Id_cliente}</p>
            <p><strong>Colaborador:</strong> {venta.Id_colaborador}</p>

            <h3 className="mt-4 font-semibold">Productos</h3>
            <ul className="list-disc ml-5">
              {detalles.map((d, i) => (
                <li key={i}>#{d.NumeroLinea || i+1} - Producto {d.Id_producto}: {d.CantidadVenta} x ${Number(d.PrecioUnitario).toFixed(2)} = ${Number(d.Subtotal).toFixed(2)}</li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-4 flex space-x-3">
          <Link
            to="/ventas"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Volver
          </Link>
          <Link
            to={`/ventas/${id}/editar`}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Editar
          </Link>
          <button onClick={handleCancel} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default DetalleVenta;