
// src/modules/Producto/Pages/ListaProducto.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const ListaProducto: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📦 Productos</h1>
      
      {/* Botón para crear nuevo producto */}
      <Link
        to="/productos/nuevo"
        className="mb-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        ➕ Nuevo Producto
      </Link>

      {/* Lista de productos (temporal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border p-4 rounded shadow">
          <h3 className="font-bold">Laptop X1</h3>
          <p>Precio: $850.00</p>
          <p>Stock: 2</p>
          <div className="mt-2">
            <Link to="/productos/1" className="text-blue-600 hover:underline mr-3">
              Ver Detalle
            </Link>
            <Link to="/productos/1/editar" className="text-green-600 hover:underline">
              Editar
            </Link>
          </div>
        </div>

        <div className="border p-4 rounded shadow">
          <h3 className="font-bold">Mouse Logi</h3>
          <p>Precio: $25.00</p>
          <p>Stock: 15</p>
          <div className="mt-2">
            <Link to="/productos/2" className="text-blue-600 hover:underline mr-3">
              Ver Detalle
            </Link>
            <Link to="/productos/2/editar" className="text-green-600 hover:underline">
              Editar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListaProducto;