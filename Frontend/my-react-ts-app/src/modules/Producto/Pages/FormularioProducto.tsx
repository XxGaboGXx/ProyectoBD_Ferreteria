// src/modules/Producto/Pages/FormularioProducto.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { createProducto, fetchProductoById, updateProducto } from "../Services/productoService";
import type { Producto } from "../Types/Producto";

const FormularioProducto: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [producto, setProducto] = useState<Partial<Producto>>({
    Nombre: "",
    Descripcion: "",
    PrecioCompra: undefined,
    PrecioVenta: 0,
    CodigoBarra: "",
    CantidadActual: 0,
    CantidadMinima: undefined,
    FechaEntrada: "",
    FechaSalida: "",
    Id_categoria: undefined,
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchProductoById(Number(id));
        setProducto(data);
      } catch (e) {
        alert('No se pudo cargar el producto');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Convertir numéricos cuando corresponda
    const numericFields = [
      'PrecioCompra',
      'PrecioVenta',
      'CantidadActual',
      'CantidadMinima',
      'Id_categoria',
    ];
    const newValue = numericFields.includes(name)
      ? (value === '' ? undefined : Number(value))
      : value;
    setProducto({ ...producto, [name]: newValue } as Partial<Producto>);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (isEdit) {
        // MODO EDICIÓN: Solo enviar campos que acepta SP_ActualizarProducto
        // NO enviar: CantidadActual, FechaEntrada, FechaSalida
        const dataToUpdate = {
          Nombre: producto.Nombre,
          Descripcion: producto.Descripcion || null,
          PrecioVenta: producto.PrecioVenta,
          PrecioCompra: producto.PrecioCompra || null,
          CantidadMinima: producto.CantidadMinima || null,
          Id_categoria: producto.Id_categoria || null,
          CodigoBarra: producto.CodigoBarra || null,
        };
        
        console.log('📤 Datos a actualizar:', dataToUpdate);
        await updateProducto(Number(id), dataToUpdate);
        alert('✅ Producto actualizado exitosamente');
      } else {
        // MODO CREACIÓN: Enviar todos los campos
        await createProducto(producto);
        alert('✅ Producto creado exitosamente');
      }
      
      navigate('/productos');
    } catch (err: any) {
      console.error('❌ Error:', err);
      const errorMsg = err?.response?.data?.error?.message || err?.response?.data?.message || 'No se pudo guardar el producto';
      alert('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <FaClipboardList className="text-blue-600" /> {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
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
            value={producto.Nombre || ''}
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
            value={producto.Descripcion || ''}
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
            value={producto.PrecioCompra ?? ''}
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
            value={producto.PrecioVenta ?? ''}
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
            value={producto.CodigoBarra || ''}
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
            value={producto.CantidadActual ?? ''}
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
            value={producto.CantidadMinima ?? ''}
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
            value={producto.FechaEntrada || ''}
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
            value={producto.FechaSalida || ''}
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
            value={producto.Id_categoria ?? ''}
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
            disabled={loading}
          >
            <FaSave /> {isEdit ? 'Actualizar Producto' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioProducto;
