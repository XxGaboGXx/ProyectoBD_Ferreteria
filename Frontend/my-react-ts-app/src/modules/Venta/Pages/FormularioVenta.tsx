
// src/modules/Venta/Pages/FormularioVenta.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaCreditCard, FaCheckCircle, FaPlus, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { createVenta, updateVenta, fetchVentaById } from '../Services/ventaService';
import { fetchClientes } from '../../Cliente/Services/clienteService';
import { fetchProductos } from '../../Producto/Services/productoService';
import type { NuevaVenta } from '../Services/ventaService';
import type { Cliente } from '../../Cliente/Types/Cliente';
import type { Producto } from '../../Producto/Types/Producto';

const FormularioVenta: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [estado, setEstado] = useState('Completada');
  const [idCliente, setIdCliente] = useState<number | ''>('');
  const [items, setItems] = useState<Array<{ Id_producto: number | ''; Cantidad: number | ''; PrecioUnitario: number | '' }>>([
    { Id_producto: '', Cantidad: 1, PrecioUnitario: '' }
  ]);

  // Listas para los dropdowns
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  // Cargar clientes y productos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientesRes, productosRes] = await Promise.all([
          fetchClientes({ limit: 1000 }),
          fetchProductos({ limit: 1000 })
        ]);
        setClientes(clientesRes.data);
        setProductos(productosRes.data);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      }
    };
    loadData();
  }, []);

  // Cargar datos de venta si es edición
  useEffect(() => {
    const loadVenta = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchVentaById(Number(id));
        console.log('📥 Venta cargada:', data);
        
        setMetodoPago(data.MetodoPago || 'Efectivo');
        setEstado(data.Estado || 'Completada');
        setIdCliente(data.Id_cliente);
        
        // Cargar detalles si existen
        if (data.detalles && data.detalles.length > 0) {
          setItems(data.detalles.map((det: any) => ({
            Id_producto: det.Id_producto,
            Cantidad: det.CantidadVenta || det.Cantidad,
            PrecioUnitario: det.PrecioUnitario
          })));
        }
      } catch (err) {
        console.error('Error al cargar venta:', err);
        alert('No se pudo cargar la venta');
      } finally {
        setLoading(false);
      }
    };
    loadVenta();
  }, [id]);

  const addItem = () => setItems((prev) => [...prev, { Id_producto: '', Cantidad: 1, PrecioUnitario: '' }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  
  const updateItem = (idx: number, field: 'Id_producto'|'Cantidad'|'PrecioUnitario', value: string | number) => {
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      
      if (field === 'Id_producto') {
        const productoId = value === '' ? '' : Number(value);
        const producto = productos.find(p => p.Id_producto === productoId);
        return {
          ...it,
          Id_producto: productoId,
          PrecioUnitario: producto ? producto.PrecioVenta : it.PrecioUnitario
        };
      }
      
      return { ...it, [field]: value === '' ? '' : Number(value) };
    }));
  };

  const calcularTotal = () => {
    return items.reduce((sum, item) => {
      const cantidad = typeof item.Cantidad === 'number' ? item.Cantidad : 0;
      const precio = typeof item.PrecioUnitario === 'number' ? item.PrecioUnitario : 0;
      return sum + (cantidad * precio);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!idCliente) {
      alert('⚠️ Debes seleccionar un cliente');
      return;
    }
    
    const productos = items
      .filter(it => it.Id_producto !== '' && it.Cantidad !== '' && it.PrecioUnitario !== '')
      .map(it => ({ 
        Id_producto: Number(it.Id_producto), 
        Cantidad: Number(it.Cantidad), 
        PrecioUnitario: Number(it.PrecioUnitario) 
      }));
      
    if (productos.length === 0) {
      alert('⚠️ Agrega al menos un producto con cantidad y precio');
      return;
    }

    const payload: NuevaVenta = {
      Id_cliente: Number(idCliente),
      Id_colaborador: 1, // Colaborador por defecto (sistema)
      MetodoPago: metodoPago,
      Estado: estado,
      Productos: productos
    };

    try {
      setLoading(true);
      
      if (isEdit) {
        await updateVenta(Number(id), payload);
        alert('✅ Venta actualizada exitosamente');
      } else {
        await createVenta(payload);
        alert('✅ Venta creada exitosamente');
      }
      
      navigate('/ventas');
    } catch (err: any) {
      console.error('❌ Error:', err);
      const errorMsg = err?.response?.data?.error?.message || err?.response?.data?.message || 'No se pudo guardar la venta';
      alert('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <FaShoppingCart className="text-green-600" /> 
        {isEdit ? 'Editar Venta' : 'Nueva Venta'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Información general */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Cliente */}
          <div className="md:col-span-1">
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <FaUser className="text-blue-600" /> Cliente
            </label>
            <select 
              className="w-full border-2 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={idCliente} 
              onChange={(e)=>setIdCliente(e.target.value === '' ? '' : Number(e.target.value))}
              required
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(cliente => (
                <option key={cliente.Id_cliente} value={cliente.Id_cliente}>
                  {cliente.Nombre} {cliente.Apellido1} {cliente.Apellido2 || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <FaCreditCard className="text-green-600" /> Método de Pago
            </label>
            <select 
              className="w-full border-2 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none bg-white" 
              value={metodoPago} 
              onChange={(e)=>setMetodoPago(e.target.value)}
            >
              <option value="Efectivo">💵 Efectivo</option>
              <option value="Tarjeta">💳 Tarjeta</option>
              <option value="Transferencia">🏦 Transferencia</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <FaCheckCircle className="text-indigo-600" /> Estado
            </label>
            <select 
              className="w-full border-2 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
              value={estado} 
              onChange={(e)=>setEstado(e.target.value)}
            >
              <option value="Completada">✅ Completada</option>
              <option value="Pendiente">⏳ Pendiente</option>
            </select>
          </div>
        </div>

        {/* Productos */}
        <div className="border-t-2 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">📦 Productos</h2>
            <button 
              type="button" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
              onClick={addItem}
            >
              <FaPlus /> Agregar Producto
            </button>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => {
              const subtotal = (typeof it.Cantidad === 'number' ? it.Cantidad : 0) * (typeof it.PrecioUnitario === 'number' ? it.PrecioUnitario : 0);
              
              return (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    
                    {/* Producto */}
                    <div className="col-span-5">
                      <label className="text-xs text-gray-600 font-semibold mb-1 block">Producto</label>
                      <select 
                        className="w-full border-2 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                        value={it.Id_producto as any} 
                        onChange={(e)=>updateItem(idx,'Id_producto', e.target.value)}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {productos.map(prod => (
                          <option key={prod.Id_producto} value={prod.Id_producto}>
                            {prod.Nombre} - ${prod.PrecioVenta.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Cantidad */}
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600 font-semibold mb-1 block">Cantidad</label>
                      <input 
                        type="number" 
                        min="1"
                        placeholder="Cant." 
                        className="w-full border-2 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        value={it.Cantidad as any} 
                        onChange={(e)=>updateItem(idx,'Cantidad', e.target.value)}
                        required
                      />
                    </div>
                    
                    {/* Precio Unitario */}
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600 font-semibold mb-1 block">Precio Unit.</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Precio" 
                        className="w-full border-2 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none bg-gray-100"
                        value={it.PrecioUnitario as any} 
                        onChange={(e)=>updateItem(idx,'PrecioUnitario', e.target.value)}
                        required
                        readOnly
                      />
                    </div>
                    
                    {/* Subtotal */}
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600 font-semibold mb-1 block">Subtotal</label>
                      <div className="text-lg font-bold text-green-600 p-2">
                        ${subtotal.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Botón eliminar */}
                    <div className="col-span-1 flex justify-end">
                      <button 
                        type="button" 
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        onClick={()=>removeItem(idx)}
                        disabled={items.length === 1}
                        title="Eliminar producto"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-semibold text-gray-700">Total de la Venta:</span>
              <span className="text-4xl font-bold text-green-600">
                ${calcularTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-between pt-6 border-t-2">
          <Link
            to="/ventas"
            className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition shadow-md"
          >
            <FaTimes /> Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 shadow-md text-lg font-semibold"
          >
            <FaSave /> {isEdit ? 'Actualizar Venta' : 'Guardar Venta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioVenta;