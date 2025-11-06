// src/modules/Compra/Pages/FormularioCompra.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaRegCalendarAlt,
  FaDollarSign,
  FaFileInvoice,
  FaTruck,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { createCompra, type NuevaCompra } from "../Services/compraService";

const FormularioCompra: React.FC = () => {
  const navigate = useNavigate();
  const [fechaCompra, setFechaCompra] = useState<string>(new Date().toISOString().slice(0, 16));
  const [totalCompra, setTotalCompra] = useState<number>(0);
  const [numeroFactura, setNumeroFactura] = useState<string>("");
  const [idProveedor, setIdProveedor] = useState<string>("");
  const [detalles, setDetalles] = useState<Array<{ Id_producto: string; CantidadCompra: string; PrecioUnitario: string }>>([
    { Id_producto: "", CantidadCompra: "", PrecioUnitario: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcularTotal = () => {
    const t = detalles.reduce((acc, d) => acc + (Number(d.CantidadCompra) * Number(d.PrecioUnitario) || 0), 0);
    setTotalCompra(Number(t.toFixed(2)));
  };

  const handleDetalleChange = (index: number, field: keyof (typeof detalles)[number], value: string) => {
    const next = [...detalles];
    next[index] = { ...next[index], [field]: value } as any;
    setDetalles(next);
    if (field === 'CantidadCompra' || field === 'PrecioUnitario') {
      calcularTotal();
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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <FaFileInvoice className="text-blue-600" /> Nueva Compra
      </h1>

      <form onSubmit={onSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {/* Fecha de compra */}
        <div className="mb-5">
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaRegCalendarAlt className="text-blue-500" /> Fecha de Compra
          </label>
          <input
            type="datetime-local"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={fechaCompra}
            onChange={(e) => setFechaCompra(e.target.value)}
          />
        </div>

        {/* Factura */}
        <div className="mb-5">
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaFileInvoice className="text-purple-600" /> Número de Factura
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej. F-001"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
          />
        </div>

        {/* Proveedor */}
        <div className="mb-5">
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaTruck className="text-orange-500" /> Proveedor
          </label>
          {/* Por ahora ingresamos el ID del proveedor manualmente; se puede reemplazar por un selector */}
          <input
            type="number"
            min={1}
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="ID del proveedor"
            value={idProveedor}
            onChange={(e) => setIdProveedor(e.target.value)}
          />
        </div>

        {/* Detalles de compra */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Productos</h3>
            <button type="button" onClick={addRow} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">+ Agregar línea</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2 pr-4 text-left">ID Producto</th>
                  <th className="py-2 pr-4 text-left">Cantidad</th>
                  <th className="py-2 pr-4 text-left">Precio Unitario</th>
                  <th className="py-2 pr-4 text-left">Subtotal</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2 pr-4">
                      <input type="number" min={1} className="border p-1 rounded w-28" value={d.Id_producto} onChange={(e) => handleDetalleChange(idx, 'Id_producto', e.target.value)} />
                    </td>
                    <td className="py-2 pr-4">
                      <input type="number" min={1} className="border p-1 rounded w-24" value={d.CantidadCompra} onChange={(e) => handleDetalleChange(idx, 'CantidadCompra', e.target.value)} />
                    </td>
                    <td className="py-2 pr-4">
                      <input type="number" step="0.01" min={0} className="border p-1 rounded w-28" value={d.PrecioUnitario} onChange={(e) => handleDetalleChange(idx, 'PrecioUnitario', e.target.value)} />
                    </td>
                    <td className="py-2 pr-4">${Number((Number(d.CantidadCompra) * Number(d.PrecioUnitario)) || 0).toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right">
                      <button type="button" onClick={() => removeRow(idx)} className="px-2 py-1 text-red-600 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total calculado */}
        <div className="mb-5">
          <label className=" text-gray-700 font-semibold mb-1 flex items-center gap-2">
            <FaDollarSign className="text-green-600" /> Total (calculado)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0.00"
            value={totalCompra}
            onChange={(e) => setTotalCompra(Number(e.target.value))}
          />
          <p className="text-xs text-gray-500 mt-1">Puedes modificarlo manualmente si fuera necesario; el backend puede recalcular.</p>
        </div>

        {/* Botones */}
        <div className="flex justify-between mt-6">
          <Link
            to="/compras"
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <FaTimes /> Cancelar
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 disabled:bg-blue-300 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FaSave /> {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioCompra;
