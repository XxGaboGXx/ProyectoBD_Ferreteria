// src/modules/Venta/Components/TarjetaVenta.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface TarjetaVentaProps {
  venta: {
    Id_venta: number;
    Fecha: string;
    TotalVenta: number;
    MetodoPago: string;
    Estado: string;
  };
}

const TarjetaVenta: React.FC<TarjetaVentaProps> = ({ venta }) => {
  const estadoColor = venta.Estado === 'Completada' ? 'text-green-500' : 'text-yellow-500';

  return (
    <div className="border p-4 rounded shadow hover:shadow-lg transition">
      <h3 className="font-bold">Venta #{venta.Id_venta}</h3>
      <p><strong>Fecha:</strong> {venta.Fecha}</p>
      <p><strong>Total:</strong> ${venta.TotalVenta}</p>
      <p><strong>Método:</strong> {venta.MetodoPago}</p>
      <p className={estadoColor}>
        <strong>Estado:</strong> {venta.Estado}
      </p>
      <div className="mt-2">
        <Link to={`/ventas/${venta.Id_venta}`} className="text-blue-600 hover:underline mr-3">
          Ver Detalle
        </Link>
        <Link to={`/ventas/${venta.Id_venta}/editar`} className="text-green-600 hover:underline">
          Editar
        </Link>
      </div>
    </div>
  );
};

export default TarjetaVenta;