// src/modules/Categoria/Pages/FormularioCategoria.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import { createCategoria, updateCategoria, fetchCategoriaById } from '../Services/categoriaService';

const FormularioCategoria: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      try {
        setLoading(true);
        const cat = await fetchCategoriaById(Number(id));
        setNombre(cat.Nombre || '');
        setDescripcion(cat.Descripcion || '');
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Error al cargar la categoría');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await updateCategoria(Number(id), { Nombre: nombre.trim(), Descripcion: descripcion || null });
      } else {
        await createCategoria({ Nombre: nombre.trim(), Descripcion: descripcion || null });
      }
      navigate('/categorias');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No se pudo guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">{isEdit ? 'Editar Categoría' : 'Nueva Categoría'}</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={onSubmit} className="max-w-xl bg-white border rounded-xl p-6 shadow space-y-4">
        <div>
          <label className="block font-semibold mb-1">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border rounded p-2" disabled={loading} />
        </div>
        <div>
          <label className="block font-semibold mb-1">Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full border rounded p-2" rows={3} disabled={loading} />
        </div>
        <div className="flex justify-between">
          <Link to="/categorias" className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"><FaTimes /> Cancelar</Link>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300 hover:bg-blue-700 flex items-center gap-2"><FaSave /> {loading ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  );
};

export default FormularioCategoria;
