
// src/modules/Producto/Components/TarjetaProducto.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface TarjetaProductoProps {
  producto: {
    Id_Producto: number;
    Nombre: string;
    PrecioVenta: number;
    CantidadActual: number;
    CantidadMinima: number;
  };
}

const TarjetaProducto: React.FC<TarjetaProductoProps> = ({ producto }) => {
  const stockColor = producto.CantidadActual <= producto.CantidadMinima ? 'text-red-500' : 'text-green-500';

  return (
    <div className="border p-4 rounded shadow hover:shadow-lg transition">
      <h3 className="font-bold">{producto.Nombre}</h3>
      <p>Precio: ${producto.PrecioVenta}</p>
      <p className={stockColor}>
        Stock: {producto.CantidadActual} / {producto.CantidadMinima}
      </p>
      <div className="mt-2">
        <Link to={`/productos/${producto.Id_Producto}`} className="text-blue-600 hover:underline mr-3">
          Ver Detalle
        </Link>
        <Link to={`/productos/${producto.Id_Producto}/editar`} className="text-green-600 hover:underline">
          Editar
        </Link>
      </div>
    </div>
  );
};

export default TarjetaProducto;