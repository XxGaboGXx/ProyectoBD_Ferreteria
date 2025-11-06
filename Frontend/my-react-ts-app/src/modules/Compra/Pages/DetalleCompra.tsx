// src/modules/Compra/Pages/DetalleCompra.tsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaFileInvoiceDollar, FaTruck } from 'react-icons/fa';
import { fetchCompraById } from '../Services/compraService';
import { fetchProveedores } from '../../Proveedor/Services/ProveedorService';
import { fetchProductos } from '../../Producto/Services/productoService';
import type { Proveedor } from '../../Proveedor/Types/Proveedor';
import type { Producto } from '../../Producto/Types/Producto';

const DetalleCompra: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [compra, setCompra] = useState<any | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [compraData, provRes, prodRes] = await Promise.all([
          fetchCompraById(Number(id)),
          fetchProveedores(),
          fetchProductos()
        ]);
        setCompra(compraData);
        setProveedores(provRes.data || []);
        setProductos(prodRes.data || []);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar la compra');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) return <div className="p-6 text-center">⏳ Cargando compra...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">❌ {error}</div>;
  if (!compra) return <div className="p-6 text-center">No se encontró la compra.</div>;

  const idProveedor = compra?.compra?.Id_proveedor ?? compra?.Id_proveedor;
  const proveedor = Array.isArray(proveedores) ? proveedores.find(p => p.Id_proveedor === idProveedor) : null;
  const nombreProveedor = proveedor ? proveedor.Nombre : `Proveedor #${idProveedor}`;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        🔍 Detalle de la Compra
      </h1>

      <div className="bg-white border p-6 rounded-2xl shadow-lg max-w-2xl mx-auto hover:shadow-xl transition">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Compra #{compra?.compra?.Id_compra ?? compra?.Id_compra}</h2>

        <div className="space-y-2 text-gray-700">
          <p><strong>📅 Fecha:</strong> {new Date(compra?.compra?.FechaCompra ?? compra?.FechaCompra).toLocaleString()}</p>
          <p><strong>💰 Total:</strong> ${Number((compra?.compra?.TotalCompra ?? compra?.TotalCompra) || 0).toFixed(2)}</p>
          <p><strong><FaFileInvoiceDollar className="inline mr-1 text-blue-600" /> Número de Factura:</strong> {(compra?.compra?.NumeroFactura ?? compra?.NumeroFactura) || '—'}</p>
          <p><strong><FaTruck className="inline mr-1 text-green-600" /> Proveedor:</strong> {nombreProveedor}</p>
        </div>

        {/* Detalles */}
        {Array.isArray(compra?.detalles) && compra.detalles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              📦 Productos
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr className="text-gray-600">
                    <th className="py-3 px-4 border">Producto</th>
                    <th className="py-3 px-4 border text-center">Cantidad</th>
                    <th className="py-3 px-4 border text-right">Precio Unit.</th>
                    <th className="py-3 px-4 border text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.detalles.map((d: any, idx: number) => {
                    const producto = Array.isArray(productos) ? productos.find(p => p.Id_producto === d.Id_producto) : null;
                    const nombreProducto = producto ? producto.Nombre : (d.NombreProducto || `Producto #${d.Id_producto}`);
                    
                    return (
                      <tr key={idx} className="border hover:bg-gray-50">
                        <td className="py-3 px-4 border">{nombreProducto}</td>
                        <td className="py-3 px-4 border text-center font-semibold">{d.CantidadCompra}</td>
                        <td className="py-3 px-4 border text-right">${Number(d.PrecioUnitario).toFixed(2)}</td>
                        <td className="py-3 px-4 border text-right font-semibold text-green-600">
                          ${Number((d.Subtotal ?? d.CantidadCompra * d.PrecioUnitario)).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/compras"
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <FaArrowLeft /> Volver
          </Link>
          {/* Backend no soporta editar/eliminar compras actualmente */}
        </div>
      </div>
    </div>
  );
};

export default DetalleCompra;
