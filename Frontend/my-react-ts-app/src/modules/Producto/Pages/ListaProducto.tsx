// src/modules/Producto/Pages/ListaProducto.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBoxOpen,
  FaDollarSign,
  FaTags,
  FaCubes,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaClipboardList,
  FaPen,
  FaInfoCircle,
  FaBarcode,
  FaTrashAlt,
} from "react-icons/fa";
import { deleteProducto, fetchProductos } from "../Services/productoService";
import type { Producto } from "../Types/Producto";

const ListaProducto: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProductos({ page: 1, limit: 50 });
      setProductos(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const eliminarProducto = async (id: number) => {
    const ok = confirm("¿Estás seguro de que deseas eliminar este producto?");
    if (!ok) return;
    try {
      await deleteProducto(id);
      setProductos((prev) => prev.filter((p) => p.Id_producto !== id));
      alert("Producto eliminado correctamente");
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo eliminar el producto');
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaClipboardList className="text-blue-600" /> Lista de Productos
        </h1>

        <Link
          to="/productos/nuevo"
          className="mt-3 sm:mt-0 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          ➕ Nuevo Producto
        </Link>
      </div>

      {/* GRID DE PRODUCTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && <p>Cargando productos...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && productos.map((producto) => (
          <div
            key={producto.Id_producto}
            className="bg-white shadow-lg rounded-2xl p-5 hover:shadow-2xl transition-all border border-gray-100 relative"
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaBoxOpen className="text-blue-600" /> {producto.Nombre}
              </h3>
              <FaTags className="text-gray-500 text-lg" />
            </div>

            {/* Descripción */}
            <p className="text-gray-600 mb-3 text-sm">
              {producto.Descripcion || 'Sin descripción'}
            </p>

            {/* Información */}
            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex items-center gap-2">
                <FaDollarSign className="text-green-600" />
                <strong>Compra:</strong> ${Number(producto.PrecioCompra ?? 0).toFixed(2)}
              </p>
              <p className="flex items-center gap-2">
                <FaDollarSign className="text-yellow-500" />
                <strong>Venta:</strong> ${Number(producto.PrecioVenta ?? 0).toFixed(2)}
              </p>
              <p className="flex items-center gap-2">
                <FaCubes className="text-purple-600" />
                <strong>Stock:</strong> {producto.CantidadActual}
              </p>
              <p className="flex items-center gap-2">
                <FaExclamationTriangle className="text-red-500" />
                <strong>Mínimo:</strong> {producto.CantidadMinima ?? '-'}
              </p>
              <p className="flex items-center gap-2">
                <FaCalendarAlt className="text-blue-500" />
                <strong>Entrada:</strong> {producto.FechaEntrada ?? '-'}
              </p>
              <p className="flex items-center gap-2">
                <FaCalendarAlt className="text-gray-500" />
                <strong>Salida:</strong>{" "}
                {producto.FechaSalida ? producto.FechaSalida : "Aún en inventario"}
              </p>
              <p className="flex items-center gap-2">
                <FaTags className="text-pink-500" />
                <strong>Categoría ID:</strong> {producto.Id_categoria ?? '-'}
              </p>
              <p className="flex items-center gap-2">
                <FaBarcode className="text-indigo-600" />
                <strong>Código:</strong> {producto.CodigoBarra ?? '-'}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="mt-5 flex justify-between items-center border-t pt-3">
              <Link
                to={`/productos/${producto.Id_producto}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
              >
                <FaInfoCircle /> Ver Detalle
              </Link>
              <Link
                to={`/productos/${producto.Id_producto}/editar`}
                className="flex items-center gap-1 text-green-600 hover:text-green-800 transition"
              >
                <FaPen /> Editar
              </Link>
              <button
                onClick={() => eliminarProducto(producto.Id_producto)}
                className="flex items-center gap-1 text-red-600 hover:text-red-800 transition"
              >
                <FaTrashAlt /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaProducto;
