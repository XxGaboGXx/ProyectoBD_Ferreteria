// src/modules/Venta/Pages/DetalleVenta.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cancelVenta, fetchDetallesVenta, fetchVentaById } from '../Services/ventaService';
import { fetchClientes } from '../../Cliente/Services/clienteService';
import { fetchColaboradores } from '../../Colaborador/Services/ColaboradorServices';
import { fetchProductos } from '../../Producto/Services/productoService';

const DetalleVenta: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState<any>(null);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) {
      setError('No se proporcionó un ID válido');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando venta #', id);
      
      const [v, d, cli, col, prod] = await Promise.all([
        fetchVentaById(Number(id)),
        fetchDetallesVenta(Number(id)),
        fetchClientes(),
        fetchColaboradores(),
        fetchProductos()
      ]);
      
      console.log('✅ Datos cargados:', { venta: v, detalles: d, clientes: cli, colaboradores: col, productos: prod });
      
      setVenta(v);
      setDetalles(d || []);
      
      // Manejar clientes - puede venir como objeto con .data o array directo
      const clientesArray = Array.isArray(cli) ? cli : ((cli as any)?.data || []);
      setClientes(clientesArray);
      
      
      
      // Manejar productos - puede venir como objeto con .data o array directo
      const productosArray = Array.isArray(prod) ? prod : ((prod as any)?.data || []);
      setProductos(productosArray);
      
      console.log('📊 Arrays procesados:', { 
        clientesArray, 
        productosArray,
        clientesEsArray: Array.isArray(clientesArray),
        productosEsArray: Array.isArray(productosArray)
      });
    } catch (e: any) {
      console.error('❌ Error al cargar venta:', e);
      setError(e?.response?.data?.message || e?.message || 'No se pudo cargar la venta');
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🔍 Detalle de la Venta</h1>
      
      <div className="border p-4 rounded shadow max-w-3xl mx-auto bg-white">
        {loading && (
          <div className="text-center py-8">
            <p className="text-lg">⏳ Cargando...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 text-lg mb-4">❌ {error}</p>
            <Link
              to="/ventas"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Volver a Ventas
            </Link>
          </div>
        )}
        
        {!loading && !error && venta && (
          <>
            <h2 className="text-xl font-bold mb-4">Venta #{venta.Id_venta}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600">Fecha:</p>
                <p className="font-semibold">{venta.Fecha}</p>
              </div>
              
              <div>
                <p className="text-gray-600">Total:</p>
                <p className="font-semibold text-green-600 text-xl">${Number(venta.TotalVenta ?? 0).toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-gray-600">Método de Pago:</p>
                <p className="font-semibold">{venta.MetodoPago}</p>
              </div>
              
              <div>
                <p className="text-gray-600">Estado:</p>
                <p className="font-semibold">{venta.Estado}</p>
              </div>
              
              <div>
                <p className="text-gray-600">Cliente:</p>
                <p className="font-semibold">{
                  (() => {
                    if (!Array.isArray(clientes) || clientes.length === 0) return venta.Id_cliente;
                    const cliente = clientes.find(c => c.Id_cliente === venta.Id_cliente);
                    return cliente ? `${cliente.Nombre} ${cliente.Apellido1} ${cliente.Apellido2 || ''}`.trim() : venta.Id_cliente;
                  })()
                }</p>
              </div>
              
              
            </div>

            <hr className="my-4" />

            <h3 className="text-lg font-semibold mb-3">📦 Productos</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">#</th>
                    <th className="border p-2 text-left">Producto</th>
                    <th className="border p-2 text-center">Cantidad</th>
                    <th className="border p-2 text-right">Precio Unit.</th>
                    <th className="border p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((d, i) => {
                    const producto = Array.isArray(productos) ? productos.find(p => p.Id_producto === d.Id_producto) : null;
                    const nombreProducto = producto ? producto.Nombre : `Producto ${d.Id_producto}`;
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="border p-2">{d.NumeroLinea || i+1}</td>
                        <td className="border p-2">{nombreProducto}</td>
                        <td className="border p-2 text-center">{d.CantidadVenta}</td>
                        <td className="border p-2 text-right">${Number(d.PrecioUnitario).toFixed(2)}</td>
                        <td className="border p-2 text-right font-semibold">${Number(d.Subtotal).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-6 flex justify-between items-center">
          <Link
            to="/ventas"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            ← Volver
          </Link>
          
          {!loading && !error && venta && (
            <div className="flex space-x-3">
              <Link
                to={`/ventas/${id}/editar`}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                ✏️ Editar
              </Link>
              <button 
                onClick={handleCancel} 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                🗑️ Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleVenta;