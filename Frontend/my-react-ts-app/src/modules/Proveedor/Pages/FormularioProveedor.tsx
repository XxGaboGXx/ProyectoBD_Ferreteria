
// src/modules/Proveedor/Pages/FormularioProveedor.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProveedorById, updateProveedor, createProveedor } from '../Services/ProveedorService';

const FormularioProveedor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estado del formulario
  const [formData, setFormData] = useState({
    Nombre: '',
    Telefono: '',
    Direccion: '',
    Correo_electronico: '',
  });

  const [isEditing, setIsEditing] = useState(false);

  // Cargar datos si es edición
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadProveedor(id);
    }
  }, [id]);

  const loadProveedor = async (id: string) => {
    try {
      const proveedor = await fetchProveedorById(Number(id));
      setFormData({
        Nombre: proveedor.Nombre || '',
        Telefono: proveedor.Telefono || '',
        Direccion: proveedor.Direccion || '',
        Correo_electronico: proveedor.Correo_electronico || '',
      });
    } catch (error) {
      console.error('Error al cargar proveedor:', error);
      alert('No se pudo cargar el proveedor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && id) {
        // Actualizar
        await updateProveedor(Number(id), formData);
        alert('Proveedor actualizado');
      } else {
        // Crear
        await createProveedor(formData);
        alert('Proveedor creado');
      }
      navigate('/proveedores');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el proveedor');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        {isEditing ? '✏️ Editar Proveedor' : '➕ Nuevo Proveedor'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Nombre</label>
          <input
            type="text"
            name="Nombre"
            value={formData.Nombre}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Teléfono</label>
          <input
            type="text"
            name="Telefono"
            value={formData.Telefono}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Dirección</label>
          <input
            type="text"
            name="Direccion"
            value={formData.Direccion}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Correo Electrónico</label>
          <input
            type="email"
            name="Correo_electronico"
            value={formData.Correo_electronico}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/proveedores')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioProveedor;