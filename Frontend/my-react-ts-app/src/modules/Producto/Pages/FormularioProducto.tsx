// src/modules/Producto/Pages/FormularioProducto.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBoxOpen,
  FaDollarSign,
  FaBarcode,
  FaCubes,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaTags,
  FaClipboardList,
  FaSave,
  FaTimesCircle,
} from "react-icons/fa";


const FormularioProducto: React.FC = () => {
  const [producto, setProducto] = useState({
    Nombre: "",
    Descripcion: "",
    PrecioCompra: "",
    PrecioVenta: "",
    CodigoBarra: "",
    CantidadActual: "",
    CantidadMinima: "",
    FechaEntrada: "",
    FechaSalida: "",
    Id_categoria: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProducto({ ...producto, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Producto guardado:", producto);
    // Aquí podrías llamar a una API (POST) para guardar en la base de datos
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <FaClipboardList className="text-blue-600" /> Nuevo Producto
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre */}
        <div>
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaBoxOpen className="text-blue-600" /> Nombre
          </label>
          <input
            type="text"
            name="Nombre"
            value={producto.Nombre}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej. Laptop X1"
            required
          />
        </div>

        {/* Descripción */}
        <div>
          <label className=" text-gray-700 font-semibold mb-1">Descripción</label>
          <textarea
            name="Descripcion"
            value={producto.Descripcion}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej. Laptop de alto rendimiento..."
            required
          ></textarea>
        </div>

        {/* Precio de compra */}
        <div>
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaDollarSign className="text-green-600" /> Precio de Compra
          </label>
          <input
            type="number"
            name="PrecioCompra"
            value={producto.PrecioCompra}
            onChange={handleChange}
            step="0.01"
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Ej. 750.00"
            required
          />
        </div>

        {/* Precio de venta */}
        <div>
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaDollarSign className="text-yellow-500" /> Precio de Venta
          </label>
          <input
            type="number"
            name="PrecioVenta"
            value={producto.PrecioVenta}
            onChange={handleChange}
            step="0.01"
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
            placeholder="Ej. 850.00"
            required
          />
        </div>

        {/* Código de barra */}
        <div>
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaBarcode className="text-indigo-600" /> Código de Barras
          </label>
          <input
            type="text"
            name="CodigoBarra"
            value={producto.CodigoBarra}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ej. 123456789001"
          />
        </div>

        {/* Cantidad actual */}
        <div>
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaCubes className="text-purple-600" /> Cantidad Actual
          </label>
          <input
            type="number"
            name="CantidadActual"
            value={producto.CantidadActual}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="Ej. 10"
            required
          />
        </div>

        {/* Cantidad mínima */}
        <div>
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" /> Cantidad Mínima
          </label>
          <input
            type="number"
            name="CantidadMinima"
            value={producto.CantidadMinima}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-red-400 outline-none"
            placeholder="Ej. 2"
            required
          />
        </div>

        {/* Fecha de entrada */}
        <div>
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500" /> Fecha de Entrada
          </label>
          <input
            type="date"
            name="FechaEntrada"
            value={producto.FechaEntrada}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
            required
          />
        </div>

        {/* Fecha de salida */}
        <div>
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaCalendarAlt className="text-gray-500" /> Fecha de Salida
          </label>
          <input
            type="date"
            name="FechaSalida"
            value={producto.FechaSalida}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-gray-400 outline-none"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaTags className="text-pink-500" /> ID Categoría
          </label>
          <input
            type="number"
            name="Id_categoria"
            value={producto.Id_categoria}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-pink-400 outline-none"
            placeholder="Ej. 1"
            required
          />
        </div>

        {/* BOTONES */}
        <div className="flex justify-between pt-4">
          <Link
            to="/productos"
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <FaTimesCircle /> Cancelar
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FaSave /> Guardar Producto
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioProducto;
