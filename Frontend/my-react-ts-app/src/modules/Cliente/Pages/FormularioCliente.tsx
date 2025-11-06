// src/modules/Cliente/Pages/FormularioCliente.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaUserAlt, FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";
import { createCliente, updateCliente, fetchClienteById } from "../Services/clienteService";
import type { Cliente, NuevoCliente } from "../Types/Cliente";
import { useToast } from "../../../hooks/useToast";
import { ToastContainer } from "../../../hooks/ToastContainer";

const FormularioCliente: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { toasts, showToast, removeToast } = useToast();
  const [form, setForm] = useState<NuevoCliente>({
    Nombre: "",
    Apellido1: "",
    Apellido2: "",
    Telefono: "",
    Correo: "",
    Direccion: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isEdit || !id) return;
      try {
        setLoading(true);
        const data = await fetchClienteById(Number(id));
        const { Id_cliente, ...rest } = data as Cliente;
        setForm({
          Nombre: rest.Nombre || "",
          Apellido1: rest.Apellido1 || "",
          Apellido2: rest.Apellido2 || "",
          Telefono: rest.Telefono || "",
          Correo: rest.Correo || "",
          Direccion: rest.Direccion || "",
        });
      } catch (e: any) {
        setError(e?.message || "Error al cargar cliente");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      if (isEdit && id) {
        await updateCliente(Number(id), form);
        showToast(`✅ Cliente "${form.Nombre} ${form.Apellido1}" actualizado exitosamente`, 'success');
      } else {
        await createCliente(form);
        showToast(`✅ Cliente "${form.Nombre} ${form.Apellido1}" creado exitosamente`, 'success');
      }
      setTimeout(() => navigate('/clientes'), 1000); // Pequeño delay para ver el toast
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al guardar el cliente');
      showToast(e?.response?.data?.message || e?.message || 'Error al guardar el cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-0">
          {isEdit ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
        </h1>
      </div>

      <form onSubmit={onSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition">
        {error && <p className="text-red-600 mb-3">{error}</p>}
        <div className="grid grid-cols-1 gap-4">
          {/* Nombre */}
          <div>
            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-1">
              <FaUserAlt className="text-blue-600" /> Nombre
            </label>
            <input
              type="text"
              placeholder="Ej. Juan"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              name="Nombre"
              value={form.Nombre}
              onChange={handleChange}
            />
          </div>

          {/* Apellido1 */}
          <div>
            <label className="text-gray-700 font-semibold mb-1">Primer Apellido</label>
            <input
              type="text"
              placeholder="Ej. Pérez"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              name="Apellido1"
              value={form.Apellido1 ?? ''}
              onChange={handleChange}
            />
          </div>

          {/* Apellido2 */}
          <div>
            <label className="text-gray-700 font-semibold mb-1">Segundo Apellido</label>
            <input
              type="text"
              placeholder="(Opcional)"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              name="Apellido2"
              value={form.Apellido2 ?? ''}
              onChange={handleChange}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-1">
              <FaPhone className="text-green-600" /> Teléfono
            </label>
            <input
              type="text"
              placeholder="Ej. 555-1234"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              name="Telefono"
              value={form.Telefono ?? ''}
              onChange={handleChange}
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-1">
              <FaMapMarkerAlt className="text-red-600" /> Dirección
            </label>
            <input
              type="text"
              placeholder="Ej. Av. Principal 123"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              name="Direccion"
              value={form.Direccion ?? ''}
              onChange={handleChange}
            />
          </div>

          {/* Correo */}
          <div>
            <label className="text-gray-700 font-semibold flex items-center gap-2 mb-1">
              <FaEnvelope className="text-purple-600" /> Correo
            </label>
            <input
              type="email"
              placeholder="Ej. cliente@ejemplo.com"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              name="Correo"
              value={form.Correo ?? ''}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 mt-6">
          <Link
            to="/clientes"
            className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 disabled:bg-blue-300 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioCliente;
