// src/modules/Alquiler/Pages/DetalleAlquiler.tsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { fetchAlquilerById, finalizarAlquiler, cancelarAlquiler, extenderAlquiler } from "../Services/alquilerService";
import { fetchClientes } from "../../Cliente/Services/clienteService";
import { fetchProductos } from "../../Producto/Services/productoService";
import type { Cliente } from "../../Cliente/Types/Cliente";
import type { Producto } from "../../Producto/Types/Producto";
import { useToast } from "../../../hooks/useToast";
import { ToastContainer } from "../../../hooks/ToastContainer";

const DetalleAlquiler: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [alquiler, setAlquiler] = useState<any | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  const cargar = async () => {
    try {
      setLoading(true);
      const [alqData, cliRes, prodRes] = await Promise.all([
        fetchAlquilerById(Number(id)),
        fetchClientes(),
        fetchProductos()
      ]);
      setAlquiler(alqData);
      
      // Validar y convertir a arrays de forma segura
      const clientesArray = Array.isArray(cliRes) ? cliRes : (Array.isArray(cliRes?.data) ? cliRes.data : []);
      setClientes(clientesArray);
      
      const productosArray = Array.isArray(prodRes) ? prodRes : (Array.isArray(prodRes?.data) ? prodRes.data : []);
      setProductos(productosArray);
      
      console.log('📊 Datos cargados en detalle:', {
        alquiler: alqData,
        detalles: alqData?.detalles,
        clientesArray: clientesArray.length,
        productosArray: productosArray.length
      });
    } catch (e: any) {
      console.error('❌ Error:', e);
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
      showToast(`✅ Alquiler finalizado exitosamente`, 'success');
      await cargar();
    } catch (e: any) {
      showToast(e?.response?.data?.message || e?.message || 'No se pudo finalizar', 'error');
    }
  };

  const onCancelar = async () => {
    const motivo = window.prompt('Motivo de cancelación:');
    if (!motivo || motivo.trim() === '') {
      showToast('⚠️ Debe ingresar un motivo de cancelación', 'warning');
      return;
    }
    try {
      console.log('📤 Cancelando alquiler:', { id, motivo });
      await cancelarAlquiler(Number(id), motivo.trim());
      showToast(`✅ Alquiler cancelado exitosamente`, 'success');
      await cargar();
    } catch (e: any) {
      console.error('❌ Error al cancelar:', e);
      showToast(e?.response?.data?.message || e?.message || 'No se pudo cancelar', 'error');
    }
  };

  const onExtender = async () => {
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
      await extenderAlquiler(Number(id), n);
      showToast(`✅ Alquiler extendido por ${n} días`, 'success');
      await cargar();
    } catch (e: any) {
      console.error('❌ Error al extender:', e);
      showToast(e?.response?.data?.message || e?.message || 'No se pudo extender', 'error');
    }
  };

  if (loading) return <div className="p-6 text-center">⏳ Cargando...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">❌ {error}</div>;
  if (!alquiler) return <div className="p-6 text-center">No se encontró el alquiler.</div>;

  const cab = alquiler?.compra ? alquiler.compra : alquiler; // por consistencia de forma
  const detalles = Array.isArray(alquiler?.detalles) ? alquiler.detalles : [];

  const cliente = Array.isArray(clientes) && clientes.length > 0 
    ? clientes.find(c => c.Id_cliente === cab.Id_cliente) 
    : null;
  const nombreCliente = cliente ? `${cliente.Nombre} ${cliente.Apellido1} ${cliente.Apellido2 || ''}`.trim() : `Cliente #${cab.Id_cliente}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl border border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          🔍 Detalle del Alquiler
        </h1>

        <div className="space-y-3 text-gray-700">
          <h2 className="text-xl font-bold text-gray-900">Alquiler #{cab.Id_alquiler}</h2>
          <p><strong>📅 Fecha Inicio:</strong> {new Date(cab.FechaInicio).toLocaleString()}</p>
          <p><strong>📅 Fecha Fin:</strong> {cab.FechaFin ? new Date(cab.FechaFin).toLocaleString() : '—'}</p>
          <p><strong>📋 Estado:</strong> <span className={cab.Estado === 'ACTIVO' ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>{cab.Estado}</span></p>
          <p><strong>💰 Total:</strong> ${Number(cab.TotalAlquiler || 0).toFixed(2)}</p>
          <p><strong>👤 Cliente:</strong> {nombreCliente}</p>
        </div>

        {detalles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">📦 Productos</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr className="text-gray-600">
                    <th className="py-3 px-4 border text-left">Producto</th>
                    <th className="py-3 px-4 border text-center">Cantidad</th>
                    <th className="py-3 px-4 border text-center">Días</th>
                    <th className="py-3 px-4 border text-right">Tarifa Diaria</th>
                    <th className="py-3 px-4 border text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((d: any, i: number) => {
                    const producto = Array.isArray(productos) && productos.length > 0 
                      ? productos.find(p => p.Id_producto === d.Id_producto) 
                      : null;
                    const nombreProducto = producto ? producto.Nombre : (d.NombreProducto || `Producto #${d.Id_producto}`);
                    
                    console.log('🔍 Detalle:', { d, producto, nombreProducto });
                    
                    return (
                      <tr key={i} className="border hover:bg-gray-50">
                        <td className="py-3 px-4 border">{nombreProducto}</td>
                        <td className="py-3 px-4 border text-center font-semibold">{d.Cantidad || 0}</td>
                        <td className="py-3 px-4 border text-center font-semibold">{d.Dias || 0}</td>
                        <td className="py-3 px-4 border text-right">${Number(d.TarifaDiaria || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 border text-right font-semibold text-green-600">
                          ${Number(d.Subtotal || (d.Cantidad * d.Dias * d.TarifaDiaria) || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
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
