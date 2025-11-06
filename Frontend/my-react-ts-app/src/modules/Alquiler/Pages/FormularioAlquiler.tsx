// src/modules/Alquiler/Pages/FormularioAlquiler.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSave, FaTimes, FaUser, FaBox } from "react-icons/fa";
import { createAlquiler, type NuevoAlquiler } from "../Services/alquilerService";
import { fetchClientes } from "../../Cliente/Services/clienteService";
import { fetchProductos } from "../../Producto/Services/productoService";
import type { Cliente } from "../../Cliente/Types/Cliente";
import type { Producto } from "../../Producto/Types/Producto";
import { useToast } from "../../../hooks/useToast";
import { ToastContainer } from "../../../hooks/ToastContainer";

const FormularioAlquiler: React.FC = () => {
  const navigate = useNavigate();
  const [idCliente, setIdCliente] = useState<string>("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const { toasts, showToast, removeToast } = useToast();
  const [detalles, setDetalles] = useState<Array<{ Id_producto: string; Cantidad: string; Dias: string; TarifaDiaria: string; Deposito?: string }>>([
    { Id_producto: "", Cantidad: "", Dias: "1", TarifaDiaria: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [cliRes, prodRes] = await Promise.all([
          fetchClientes(),
          fetchProductos()
        ]);
        setClientes(cliRes.data || []);
        setProductos(prodRes.data || []);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      }
    };
    cargarDatos();
  }, []);

  const handleDetalleChange = (i: number, field: keyof (typeof detalles)[number], value: string) => {
    const next = [...detalles];
    next[i] = { ...next[i], [field]: value } as any;
    setDetalles(next);
  };
  const addRow = () => setDetalles((d) => [...d, { Id_producto: "", Cantidad: "", Dias: "1", TarifaDiaria: "" }]);
  const removeRow = (idx: number) => setDetalles((d) => d.filter((_, i) => i !== idx));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const detallesValidos = detalles
      .map((d) => ({
        Id_producto: Number(d.Id_producto),
        Cantidad: Number(d.Cantidad),
        Dias: Number(d.Dias),
        TarifaDiaria: Number(d.TarifaDiaria),
        Deposito: d.Deposito ? Number(d.Deposito) : undefined,
      }))
      .filter((d) => d.Id_producto && d.Cantidad > 0 && d.Dias > 0 && d.TarifaDiaria > 0);

    if (!idCliente) {
      setError('Seleccione un cliente válido.');
      return;
    }
    if (detallesValidos.length === 0) {
      setError('Agregue al menos un producto con cantidad, días y tarifa válidos.');
      return;
    }

    const payload: NuevoAlquiler = {
      Id_cliente: Number(idCliente),
      Id_colaborador: 1, // Hardcodeado
      detalles: detallesValidos,
    };

    try {
      setSubmitting(true);
      await createAlquiler(payload);
      showToast('✅ Alquiler creado exitosamente', 'success');
      setTimeout(() => navigate('/alquileres'), 1000); // Pequeño delay para ver el toast
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al crear el alquiler');
      showToast(e?.response?.data?.message || e?.message || 'Error al crear el alquiler', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalEstimado = detalles.reduce((acc, d) => acc + (Number(d.Cantidad) * Number(d.Dias) * Number(d.TarifaDiaria) || 0), 0);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-800">
        🎁 Nuevo Alquiler
      </h1>

      <form onSubmit={onSubmit} className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold">❌ {error}</p>
          </div>
        )}

        <div className="mb-6">
          {/* Cliente */}
          <div>
            <label className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <FaUser className="text-blue-500" /> Cliente
            </label>
            <select
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((cli) => (
                <option key={cli.Id_cliente} value={cli.Id_cliente}>
                  {`${cli.Nombre} ${cli.Apellido1} ${cli.Apellido2 || ''}`.trim()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FaBox className="text-orange-500" /> Productos a Alquilar
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
              const subtotal = Number(Number(d.Cantidad) * Number(d.Dias) * Number(d.TarifaDiaria) || 0).toFixed(2);

              return (
                <div key={idx} className="border-2 border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {/* Producto */}
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-600 mb-1 block">Producto</label>
                      <select
                        value={d.Id_producto}
                        onChange={(e) => handleDetalleChange(idx, 'Id_producto', e.target.value)}
                        className="w-full border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {productos.map((prod) => (
                          <option key={prod.Id_producto} value={prod.Id_producto}>
                            {prod.Nombre}
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
                        value={d.Cantidad}
                        onChange={(e) => handleDetalleChange(idx, 'Cantidad', e.target.value)}
                        className="w-full border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>

                    {/* Días */}
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Días</label>
                      <input
                        type="number"
                        min={1}
                        value={d.Dias}
                        onChange={(e) => handleDetalleChange(idx, 'Dias', e.target.value)}
                        className="w-full border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>

                    {/* Tarifa Diaria */}
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Tarifa/Día</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={d.TarifaDiaria}
                        onChange={(e) => handleDetalleChange(idx, 'TarifaDiaria', e.target.value)}
                        className="w-full border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>

                    {/* Depósito */}
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Depósito</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={d.Deposito || ''}
                        onChange={(e) => handleDetalleChange(idx, 'Deposito', e.target.value)}
                        className="w-full border-2 border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Opcional"
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

        {/* Total */}
        <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border-2 border-green-200">
          <div className="text-center">
            <p className="text-gray-700 text-lg mb-2">💰 Total Estimado del Alquiler</p>
            <p className="text-4xl font-bold text-green-600">${totalEstimado.toFixed(2)}</p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-200">
          <Link
            to="/alquileres"
            className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition shadow-md"
          >
            <FaTimes /> Cancelar
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 disabled:bg-green-300 text-white rounded-lg hover:bg-green-700 transition shadow-md font-semibold"
          >
            <FaSave /> {submitting ? '⏳ Guardando...' : '💾 Guardar Alquiler'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioAlquiler;
