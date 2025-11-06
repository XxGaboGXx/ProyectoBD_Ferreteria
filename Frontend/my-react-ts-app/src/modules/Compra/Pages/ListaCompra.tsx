// src/modules/Compra/Pages/ListaCompra.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaShoppingCart,
  FaRegCalendarAlt,
  FaFileInvoiceDollar,
  FaTruck,
  FaDollarSign,
  FaSearch,
  // FaRegEdit,
  // FaTrashAlt,
} from "react-icons/fa";
import { fetchCompras } from "../Services/compraService";
import { fetchProveedores } from "../../Proveedor/Services/ProveedorService";
import type { Compra } from "../Types/Compra";
import type { Proveedor } from "../../Proveedor/Types/Proveedor";

const ListaCompra: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [comprasResp, provResp] = await Promise.all([
          fetchCompras({ page: 1, limit: 20 }),
          fetchProveedores()
        ]);
        setCompras(comprasResp.data);
        setProveedores(provResp.data || []);
      } catch (e: any) {
        setError(e?.message || "Error al cargar compras");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6">
      {/* Encabezado con botón a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
          <FaShoppingCart className="text-blue-600" /> Lista de Compras
        </h1>

        <Link
          to="/compras/nuevo"
          className="mt-4 sm:mt-0 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          ➕ Nueva Compra
        </Link>
      </div>

      {loading && <p className="text-gray-600">Cargando compras...</p>}
      {error && (
        <p className="text-red-600">Ocurrió un error cargando compras: {error}</p>
      )}

      {/* Cards de compras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && !error && compras.map((compra) => {
          const proveedor = proveedores.find(p => p.Id_proveedor === compra.Id_proveedor);
          const nombreProveedor = proveedor ? proveedor.Nombre : `Proveedor #${compra.Id_proveedor}`;
          
          return (
            <div
              key={compra.Id_compra}
              className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                <FaFileInvoiceDollar className="inline-block text-blue-600 mr-2" />
                Compra #{compra.Id_compra}
              </h3>

              <p className="text-gray-600 flex items-center gap-2">
                <FaRegCalendarAlt className="text-blue-500" />
                <strong>Fecha:</strong> {new Date(compra.FechaCompra).toLocaleString()}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <FaDollarSign className="text-green-600" />
                <strong>Total:</strong> ${Number(compra.TotalCompra || 0).toFixed(2)}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <FaFileInvoiceDollar className="text-purple-600" />
                <strong>Factura:</strong> {compra.NumeroFactura || '—'}
              </p>

              <p className="text-gray-600 flex items-center gap-2">
                <FaTruck className="text-orange-500" />
                <strong>Proveedor:</strong> {nombreProveedor}
              </p>

              {/* Botones de acción */}
              <div className="mt-4 flex justify-between">
                <Link
                  to={`/compras/${compra.Id_compra}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <FaSearch /> Ver Detalle
                </Link>

                {/* Backend no soporta editar/eliminar compras actualmente */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListaCompra;
