
// src/modules/Venta/Pages/FormularioVenta.tsx
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createVenta } from '../Services/ventaService';
import type { NuevaVenta } from '../Services/ventaService';

const FormularioVenta: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id); // Nota: backend no expone PUT, este flag es informativo por ahora

  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [estado, setEstado] = useState('Completada');
  const [idCliente, setIdCliente] = useState<number | ''>('');
  const [idColaborador, setIdColaborador] = useState<number | ''>('');
  const [items, setItems] = useState<Array<{ Id_producto: number | ''; Cantidad: number | ''; PrecioUnitario: number | '' }>>([
    { Id_producto: '', Cantidad: '', PrecioUnitario: '' }
  ]);
  const [enviando, setEnviando] = useState(false);

  const addItem = () => setItems((prev) => [...prev, { Id_producto: '', Cantidad: '', PrecioUnitario: '' }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: 'Id_producto'|'Cantidad'|'PrecioUnitario', value: string) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value === '' ? '' : Number(value) } : it));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      alert('Editar venta no está disponible en el backend. Puedes cancelar la venta y crear una nueva.');
      return;
    }
    if (!idCliente || !idColaborador) {
      alert('Debes indicar Cliente y Colaborador');
      return;
    }
    const productos = items
      .filter(it => it.Id_producto !== '' && it.Cantidad !== '' && it.PrecioUnitario !== '')
      .map(it => ({ Id_producto: Number(it.Id_producto), Cantidad: Number(it.Cantidad), PrecioUnitario: Number(it.PrecioUnitario) }));
    if (productos.length === 0) {
      alert('Agrega al menos un producto con cantidad y precio');
      return;
    }

    const payload: NuevaVenta = {
      Id_cliente: Number(idCliente),
      Id_colaborador: Number(idColaborador),
      MetodoPago: metodoPago,
      Estado: estado,
      Productos: productos
    };

    try {
      setEnviando(true);
      await createVenta(payload);
      alert('Venta creada');
      navigate('/ventas');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'No se pudo crear la venta');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{isEdit ? '✏️ Editar Venta' : '➕ Nueva Venta'}</h1>
      
      <form className="max-w-2xl mx-auto" onSubmit={handleSubmit}>

        <div className="mb-4">
          <label className="block text-gray-700">Método de Pago</label>
          <select className="w-full border p-2 rounded" value={metodoPago} onChange={(e)=>setMetodoPago(e.target.value)}>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Estado</label>
          <select className="w-full border p-2 rounded" value={estado} onChange={(e)=>setEstado(e.target.value)}>
            <option value="Completada">Completada</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Cliente</label>
          <input type="number" className="w-full border p-2 rounded" placeholder="Id del cliente" value={idCliente} onChange={(e)=>setIdCliente(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Colaborador</label>
          <input type="number" className="w-full border p-2 rounded" placeholder="Id del colaborador" value={idColaborador} onChange={(e)=>setIdColaborador(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>

        {/* Productos */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-700 font-semibold">Productos</label>
            <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded" onClick={addItem}>Agregar producto</button>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2 mb-2 items-center">
              <input type="number" placeholder="Id Producto" className="border p-2 rounded" value={it.Id_producto as any} onChange={(e)=>updateItem(idx,'Id_producto', e.target.value)} />
              <input type="number" placeholder="Cantidad" className="border p-2 rounded" value={it.Cantidad as any} onChange={(e)=>updateItem(idx,'Cantidad', e.target.value)} />
              <div className="flex gap-2">
                <input type="number" step="0.01" placeholder="Precio Unitario" className="border p-2 rounded w-full" value={it.PrecioUnitario as any} onChange={(e)=>updateItem(idx,'PrecioUnitario', e.target.value)} />
                <button type="button" className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>removeItem(idx)}>X</button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Link
            to="/ventas"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={enviando}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {isEdit ? 'Guardar Cambios' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioVenta;