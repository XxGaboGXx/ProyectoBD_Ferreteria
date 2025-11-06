// src/modules/Alquiler/Pages/FormularioAlquiler.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSave, FaTimes } from "react-icons/fa";
import { createAlquiler, type NuevoAlquiler } from "../Services/alquilerService";

const FormularioAlquiler: React.FC = () => {
  const navigate = useNavigate();
  const [idCliente, setIdCliente] = useState<string>("");
  const [idColaborador, setIdColaborador] = useState<string>("");
  const [detalles, setDetalles] = useState<Array<{ Id_producto: string; Cantidad: string; Dias: string; TarifaDiaria: string; Deposito?: string }>>([
    { Id_producto: "", Cantidad: "", Dias: "1", TarifaDiaria: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (!idCliente || !idColaborador) {
      setError('Ingrese IDs válidos de cliente y colaborador.');
      return;
    }
    if (detallesValidos.length === 0) {
      setError('Agregue al menos un producto con cantidad, días y tarifa válidos.');
      return;
    }

    const payload: NuevoAlquiler = {
      Id_cliente: Number(idCliente),
      Id_colaborador: Number(idColaborador),
      detalles: detallesValidos,
    };

    try {
      setSubmitting(true);
      await createAlquiler(payload);
      navigate('/alquileres');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al crear el alquiler');
    } finally {
      setSubmitting(false);
    }
  };

  const totalEstimado = detalles.reduce((acc, d) => acc + (Number(d.Cantidad) * Number(d.Dias) * Number(d.TarifaDiaria) || 0), 0);

  return (
    <div className="bg-white shadow-lg rounded-2xl p-8 max-w-4xl mx-auto border border-gray-200">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-8 text-center">
        ➕ Nuevo Alquiler
      </h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-700 font-medium">ID Cliente</label>
            <input type="number" min={1} value={idCliente} onChange={(e) => setIdCliente(e.target.value)} className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-gray-700 font-medium">ID Colaborador</label>
            <input type="number" min={1} value={idColaborador} onChange={(e) => setIdColaborador(e.target.value)} className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div>
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
                  <th className="py-2 pr-4 text-left">Días</th>
                  <th className="py-2 pr-4 text-left">Tarifa Diaria</th>
                  <th className="py-2 pr-4 text-left">Depósito (opcional)</th>
                  <th className="py-2 pr-4 text-left">Subtotal</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2 pr-4"><input type="number" min={1} value={d.Id_producto} onChange={(e) => handleDetalleChange(idx, 'Id_producto', e.target.value)} className="border p-1 rounded w-28" /></td>
                    <td className="py-2 pr-4"><input type="number" min={1} value={d.Cantidad} onChange={(e) => handleDetalleChange(idx, 'Cantidad', e.target.value)} className="border p-1 rounded w-24" /></td>
                    <td className="py-2 pr-4"><input type="number" min={1} value={d.Dias} onChange={(e) => handleDetalleChange(idx, 'Dias', e.target.value)} className="border p-1 rounded w-24" /></td>
                    <td className="py-2 pr-4"><input type="number" step="0.01" min={0} value={d.TarifaDiaria} onChange={(e) => handleDetalleChange(idx, 'TarifaDiaria', e.target.value)} className="border p-1 rounded w-28" /></td>
                    <td className="py-2 pr-4"><input type="number" step="0.01" min={0} value={d.Deposito || ''} onChange={(e) => handleDetalleChange(idx, 'Deposito', e.target.value)} className="border p-1 rounded w-28" /></td>
                    <td className="py-2 pr-4">${Number(Number(d.Cantidad) * Number(d.Dias) * Number(d.TarifaDiaria) || 0).toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right"><button type="button" onClick={() => removeRow(idx)} className="text-red-600 hover:underline">Eliminar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-gray-700">Total estimado: <strong>${totalEstimado.toFixed(2)}</strong></p>

          <div className="flex gap-3">
            <Link
              to="/alquileres"
              className="flex items-center gap-2 px-5 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
            >
              <FaTimes /> Cancelar
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 disabled:bg-blue-300 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              <FaSave /> {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FormularioAlquiler;
