
// src/modules/Cliente/Pages/DetalleCliente.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FaUserAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaUserTag,
  FaArrowLeft,
  FaRegEdit,
} from "react-icons/fa";

const DetalleCliente: React.FC = () => {
  const cliente = {
    id: 1,
    nombre: "Juan Pérez",
    telefono: "555-1234",
    direccion: "Av. Principal 123",
    correo: "juan@ejemplo.com",
    tipo: "Contado",
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-0">
          🔍 Detalle del Cliente
        </h1>
      </div>

      <div className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <FaUserAlt className="text-blue-600" /> {cliente.nombre}
        </h2>

        <div className="space-y-2 text-gray-700">
          <p className="flex items-center gap-2">
            <FaPhone className="text-green-600" />
            <strong>Teléfono:</strong> {cliente.telefono}
          </p>

          <p className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-red-600" />
            <strong>Dirección:</strong> {cliente.direccion}
          </p>

          <p className="flex items-center gap-2">
            <FaEnvelope className="text-purple-600" />
            <strong>Correo:</strong> {cliente.correo}
          </p>

          <p className="flex items-center gap-2">
            <FaUserTag className="text-yellow-500" />
            <strong>Tipo de Cliente:</strong> {cliente.tipo}
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
            to={`/clientes/${cliente.id}/editar`}
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
