// src/modules/Producto/Pages/ListaProducto.tsx
import React from "react";
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

const ListaProducto: React.FC = () => {
  const productos = [
    {
      Id_Producto: 1,
      Nombre: "Laptop X1",
      Descripcion: "Laptop de alto rendimiento con procesador i7.",
      PrecioCompra: 750.0,
      PrecioVenta: 850.0,
      CodigoBarra: "123456789001",
      CantidadActual: 2,
      CantidadMinima: 1,
      FechaEntrada: "2025-11-01",
      FechaSalida: null,
      Id_categoria: 3,
    },
    {
      Id_Producto: 2,
      Nombre: "Mouse Logi",
      Descripcion: "Mouse inalámbrico ergonómico con sensor óptico.",
      PrecioCompra: 18.0,
      PrecioVenta: 25.0,
      CodigoBarra: "123456789002",
      CantidadActual: 15,
      CantidadMinima: 5,
      FechaEntrada: "2025-11-02",
      FechaSalida: null,
      Id_categoria: 2,
    },
  ];

  // Función simulada para eliminar un producto
  const eliminarProducto = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      console.log(`Producto con ID ${id} eliminado.`);
      // Aquí iría la lógica real para eliminar (API o base de datos)
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaClipboardList className="text-blue-600" /> Lista de Productos
        </h1>

        <Link
          to="/formulario-producto"
          className="mt-3 sm:mt-0 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          ➕ Nuevo Producto
        </Link>
      </div>

      {/* GRID DE PRODUCTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos.map((producto) => (
          <div
            key={producto.Id_Producto}
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
              {producto.Descripcion}
            </p>

            {/* Información */}
            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex items-center gap-2">
                <FaDollarSign className="text-green-600" />
                <strong>Compra:</strong> ${producto.PrecioCompra.toFixed(2)}
              </p>
              <p className="flex items-center gap-2">
                <FaDollarSign className="text-yellow-500" />
                <strong>Venta:</strong> ${producto.PrecioVenta.toFixed(2)}
              </p>
              <p className="flex items-center gap-2">
                <FaCubes className="text-purple-600" />
                <strong>Stock:</strong> {producto.CantidadActual}
              </p>
              <p className="flex items-center gap-2">
                <FaExclamationTriangle className="text-red-500" />
                <strong>Mínimo:</strong> {producto.CantidadMinima}
              </p>
              <p className="flex items-center gap-2">
                <FaCalendarAlt className="text-blue-500" />
                <strong>Entrada:</strong> {producto.FechaEntrada}
              </p>
              <p className="flex items-center gap-2">
                <FaCalendarAlt className="text-gray-500" />
                <strong>Salida:</strong>{" "}
                {producto.FechaSalida ? producto.FechaSalida : "Aún en inventario"}
              </p>
              <p className="flex items-center gap-2">
                <FaTags className="text-pink-500" />
                <strong>Categoría ID:</strong> {producto.Id_categoria}
              </p>
              <p className="flex items-center gap-2">
                <FaBarcode className="text-indigo-600" />
                <strong>Código:</strong> {producto.CodigoBarra}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="mt-5 flex justify-between items-center border-t pt-3">
              <Link
                to={`/productos/${producto.Id_Producto}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
              >
                <FaInfoCircle /> Ver Detalle
              </Link>
              <Link
                to={`/productos/${producto.Id_Producto}/editar`}
                className="flex items-center gap-1 text-green-600 hover:text-green-800 transition"
              >
                <FaPen /> Editar
              </Link>
              <button
                onClick={() => eliminarProducto(producto.Id_Producto)}
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
