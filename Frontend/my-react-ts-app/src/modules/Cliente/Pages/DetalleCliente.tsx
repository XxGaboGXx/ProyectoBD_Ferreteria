
// src/modules/Cliente/Pages/DetalleCliente.tsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaUserAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaArrowLeft,
  FaRegEdit,
} from "react-icons/fa";
import { fetchClienteById } from "../Services/clienteService";
import type { Cliente } from "../Types/Cliente";

const DetalleCliente: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await fetchClienteById(Number(id));
        setCliente(data);
      } catch (e: any) {
        setError(e?.message || "Error al cargar cliente");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6">Cargando cliente...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!cliente) return <div className="p-6">Cliente no encontrado.</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-0">
          🔍 Detalle del Cliente
        </h1>
      </div>

      <div className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <FaUserAlt className="text-blue-600" /> {cliente.Nombre} {cliente.Apellido1} {cliente.Apellido2 ?? ''}
        </h2>

        <div className="space-y-2 text-gray-700">
          <p className="flex items-center gap-2">
            <FaPhone className="text-green-600" />
            <strong>Teléfono:</strong> {cliente.Telefono ?? '—'}
          </p>

          <p className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-red-600" />
            <strong>Dirección:</strong> {cliente.Direccion ?? '—'}
          </p>

          <p className="flex items-center gap-2">
            <FaEnvelope className="text-purple-600" />
            <strong>Correo:</strong> {cliente.Correo ?? '—'}
          </p>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex justify-end gap-4">
          <Link
            to="/clientes"
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition"
          >
            <FaArrowLeft /> Volver
          </Link>

          <Link
            to={`/clientes/${cliente.Id_cliente}/editar`}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            <FaRegEdit /> Editar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DetalleCliente;
