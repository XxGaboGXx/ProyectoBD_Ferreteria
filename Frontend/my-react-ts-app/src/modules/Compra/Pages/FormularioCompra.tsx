// src/modules/Compra/Pages/FormularioCompra.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaRegCalendarAlt,
  FaDollarSign,
  FaFileInvoice,
  FaTruck,
  FaSave,
  FaTimes,
  FaBox,
} from "react-icons/fa";
import { createCompra, type NuevaCompra } from "../Services/compraService";
import { fetchProveedores } from "../../Proveedor/Services/ProveedorService";
import { fetchProductos } from "../../Producto/Services/productoService";
import type { Proveedor } from "../../Proveedor/Types/Proveedor";
import type { Producto } from "../../Producto/Types/Producto";

const FormularioCompra: React.FC = () => {
  const navigate = useNavigate();
  const [fechaCompra, setFechaCompra] = useState<string>(new Date().toISOString().slice(0, 16));
  const [totalCompra, setTotalCompra] = useState<number>(0);
  const [numeroFactura, setNumeroFactura] = useState<string>("");
  const [idProveedor, setIdProveedor] = useState<string>("");
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [detalles, setDetalles] = useState<Array<{ Id_producto: string; CantidadCompra: string; PrecioUnitario: string }>>([
    { Id_producto: "", CantidadCompra: "", PrecioUnitario: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar proveedores y productos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [provRes, prodRes] = await Promise.all([
          fetchProveedores(),
          fetchProductos()
        ]);
        setProveedores(provRes.data || []);
        setProductos(prodRes.data || []);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      }
    };
    cargarDatos();
  }, []);

  const calcularTotal = () => {
    const t = detalles.reduce((acc, d) => acc + (Number(d.CantidadCompra) * Number(d.PrecioUnitario) || 0), 0);
    setTotalCompra(Number(t.toFixed(2)));
  };

  const handleDetalleChange = (index: number, field: keyof (typeof detalles)[number], value: string) => {
    const next = [...detalles];
    next[index] = { ...next[index], [field]: value } as any;
    
    // Si se selecciona un producto, auto-completar el precio de compra
    if (field === 'Id_producto' && value) {
      const producto = productos.find(p => p.Id_producto === Number(value));
      if (producto && producto.PrecioCompra) {
        next[index].PrecioUnitario = producto.PrecioCompra.toString();
      }
    }
    
    setDetalles(next);
    if (field === 'CantidadCompra' || field === 'PrecioUnitario' || field === 'Id_producto') {
      // Recalcular después de actualizar el estado
      setTimeout(() => calcularTotal(), 0);
    }
  };

  const addRow = () => setDetalles((d) => [...d, { Id_producto: "", CantidadCompra: "", PrecioUnitario: "" }]);
  const removeRow = (idx: number) => setDetalles((d) => d.filter((_, i) => i !== idx));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Validaciones mínimas
    if (!idProveedor) {
      setError('Seleccione o ingrese un proveedor válido (ID).');
      return;
    }
    const detallesValidos = detalles
      .map((d) => ({ Id_producto: Number(d.Id_producto), CantidadCompra: Number(d.CantidadCompra), PrecioUnitario: Number(d.PrecioUnitario) }))
      .filter((d) => d.Id_producto && d.CantidadCompra > 0 && d.PrecioUnitario > 0);
    if (detallesValidos.length === 0) {
      setError('Agregue al menos un producto con cantidad y precio válidos.');
      return;
    }

    const payload: NuevaCompra = {
      Id_proveedor: Number(idProveedor),
      FechaCompra: new Date(fechaCompra).toISOString(),
      NumeroFactura: numeroFactura || null,
      TotalCompra: totalCompra || undefined,
      detalles: detallesValidos,
    };

    try {
      setSubmitting(true);
      await createCompra(payload);
      navigate('/compras');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al crear la compra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-800">
        <FaFileInvoice className="text-blue-600" /> 🛒 Nueva Compra
      </h1>

      <form onSubmit={onSubmit} className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold">❌ {error}</p>
          </div>
        )}
        
        {/* Fecha de compra */}
        <div className="mb-5">
          <label className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
            <FaRegCalendarAlt className="text-blue-500" /> Fecha de Compra
          </label>
          <input
            type="datetime-local"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={fechaCompra}
            onChange={(e) => setFechaCompra(e.target.value)}
            required
          />
        </div>

        {/* Factura */}
        <div className="mb-5">
          <label className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
            <FaFileInvoice className="text-purple-600" /> Número de Factura
          </label>
          <input
            type="text"
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
            placeholder="Ej. FACT-2025-001"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
          />
        </div>

        {/* Proveedor */}
        <div className="mb-5">
          <label className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
            <FaTruck className="text-orange-500" /> Proveedor
          </label>
          <select
            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            value={idProveedor}
            onChange={(e) => setIdProveedor(e.target.value)}
            required
          >
            <option value="">Seleccionar proveedor...</option>
            {proveedores.map((prov) => (
              <option key={prov.Id_proveedor} value={prov.Id_proveedor}>
                {prov.Nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Detalles de compra */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FaBox className="text-purple-600" /> Productos
            </h3>
            <button 
              type="button" 
              onClick={addRow} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              ➕ Agregar Producto
            </button>
          </div>
          
          <div className="space-y-4">
            {detalles.map((d, idx) => {
              const subtotal = Number((Number(d.CantidadCompra) * Number(d.PrecioUnitario)) || 0).toFixed(2);
              
              return (
                <div key={idx} className="border-2 border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Producto */}
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-600 mb-1 block">Producto</label>
                      <select
                        className="w-full border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={d.Id_producto}
                        onChange={(e) => handleDetalleChange(idx, 'Id_producto', e.target.value)}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {productos.map((prod) => (
                          <option key={prod.Id_producto} value={prod.Id_producto}>
                            {prod.Nombre} - ${prod.PrecioCompra || prod.PrecioVenta}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Cantidad */}
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Cantidad</label>
                      <input 
                        type="number" 
                        min={1} 
                        className="w-full border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={d.CantidadCompra} 
                        onChange={(e) => handleDetalleChange(idx, 'CantidadCompra', e.target.value)}
                        required
                      />
                    </div>
                    
                    {/* Precio Unitario */}
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Precio Unit.</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min={0} 
                        className="w-full border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={d.PrecioUnitario} 
                        onChange={(e) => handleDetalleChange(idx, 'PrecioUnitario', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Subtotal y Eliminar */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-300">
                    <div className="text-lg font-semibold text-green-600">
                      Subtotal: ${subtotal}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeRow(idx)} 
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total calculado */}
        <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border-2 border-green-200">
          <label className="text-gray-700 font-semibold mb-3 flex items-center gap-2 text-lg">
            <FaDollarSign className="text-green-600 text-2xl" /> Total de la Compra
          </label>
          <div className="text-4xl font-bold text-green-600 text-center my-2">
            ${totalCompra.toFixed(2)}
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            💡 El total se calcula automáticamente. Puedes modificarlo si es necesario.
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-200">
          <Link
            to="/compras"
            className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition shadow-md"
          >
            <FaTimes /> Cancelar
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 disabled:bg-green-300 text-white rounded-lg hover:bg-green-700 transition shadow-md font-semibold"
          >
            <FaSave /> {submitting ? '⏳ Guardando...' : '💾 Guardar Compra'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioCompra;
