// src/modules/Categoria/Pages/ListaCategoria.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaList, FaSearch, FaRegEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';
import { fetchCategorias, deleteCategoria } from '../Services/categoriaService';
import type { Categoria } from '../Types/Categoria';

const ListaCategoria: React.FC = () => {
  const [items, setItems] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const resp = await fetchCategorias({ page: 1, limit: 50 });
      setItems(resp.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    try {
      await deleteCategoria(id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo eliminar la categoría. Puede tener productos asociados.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
          <FaList className="text-blue-600" /> Categorías
        </h1>
        <Link to="/categorias/nuevo" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <FaPlus /> Nueva Categoría
        </Link>
      </div>

      {loading && <p className="text-gray-600">Cargando categorías...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto bg-white rounded-xl shadow border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.Id_categoria} className="border-t">
                  <td className="py-2 px-4">{c.Id_categoria}</td>
                  <td className="py-2 px-4">{c.Nombre}</td>
                  <td className="py-2 px-4">{c.Descripcion || '—'}</td>
                  <td className="py-2 px-4 flex gap-4">
                    <Link to={`/categorias/${c.Id_categoria}`} className="text-blue-600 hover:underline flex items-center gap-1"><FaSearch /> Ver</Link>
                    <Link to={`/categorias/${c.Id_categoria}/editar`} className="text-green-600 hover:underline flex items-center gap-1"><FaRegEdit /> Editar</Link>
                    <button onClick={() => onDelete(c.Id_categoria)} className="text-red-600 hover:underline flex items-center gap-1"><FaTrashAlt /> Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListaCategoria;
