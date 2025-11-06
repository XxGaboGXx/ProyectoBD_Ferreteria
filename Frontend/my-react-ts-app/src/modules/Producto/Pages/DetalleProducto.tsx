// src/modules/Producto/Pages/DetalleProducto.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaBarcode,
  FaBoxOpen,
  FaDollarSign,
  FaClipboardList,
  FaCalendarAlt,
  FaArrowLeft,
  FaEdit,
  FaTrashAlt,
  FaLayerGroup,
} from "react-icons/fa";
import { deleteProducto, fetchProductoById } from "../Services/productoService";
import type { Producto } from "../Types/Producto";

const DetalleProducto: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await fetchProductoById(Number(id));
        setProducto(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'No se pudo cargar el producto');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    const ok = confirm('¿Deseas eliminar este producto?');
    if (!ok) return;
    try {
      await deleteProducto(Number(id));
      alert('Producto eliminado');
      navigate('/productos');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo eliminar');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <FaBoxOpen className="text-blue-600" /> Detalle del Producto
      </h1>

      <div className="bg-white shadow-lg rounded-2xl p-6 max-w-lg mx-auto border border-gray-100">
        {loading && <p>Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && producto && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              {producto.Nombre}
            </h2>
            <p className="text-gray-600 mb-4">
              <FaClipboardList className="inline-block text-blue-500 mr-2" />
              {producto.Descripcion || 'Sin descripción'}
            </p>

            <div className="space-y-2 text-gray-700">
              <p>
                <FaDollarSign className="inline-block text-green-600 mr-2" />
                <strong>Precio Compra:</strong> ${Number(producto.PrecioCompra ?? 0).toFixed(2)}
              </p>
              <p>
                <FaDollarSign className="inline-block text-green-600 mr-2" />
                <strong>Precio Venta:</strong> ${Number(producto.PrecioVenta ?? 0).toFixed(2)}
              </p>
              <p>
                <FaBoxOpen className="inline-block text-yellow-500 mr-2" />
                <strong>Cantidad Actual:</strong> {producto.CantidadActual} unidades
              </p>
              <p>
                <FaBoxOpen className="inline-block text-red-500 mr-2" />
                <strong>Cantidad Mínima:</strong> {producto.CantidadMinima ?? '-'} unidad(es)
              </p>
              <p>
                <FaLayerGroup className="inline-block text-purple-500 mr-2" />
                <strong>Categoría ID:</strong> {producto.Id_categoria ?? '-'}
              </p>
              <p>
                <FaBarcode className="inline-block text-gray-600 mr-2" />
                <strong>Código de Barras:</strong> {producto.CodigoBarra ?? '-'}
              </p>
              <p>
                <FaCalendarAlt className="inline-block text-blue-500 mr-2" />
                <strong>Fecha Entrada:</strong> {producto.FechaEntrada ?? '-'}
              </p>
              <p>
                <FaCalendarAlt className="inline-block text-gray-400 mr-2" />
                <strong>Fecha Salida:</strong> {producto.FechaSalida ?? '—'}
              </p>
            </div>
          </>
        )}

        <div className="mt-6 flex justify-between">
          <Link
            to="/productos"
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <FaArrowLeft /> Volver
          </Link>

          <div className="flex gap-3">
            <Link
              to={`/productos/${id}/editar`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FaEdit /> Editar
            </Link>

            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              onClick={handleDelete}
            >
              <FaTrashAlt /> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleProducto;
