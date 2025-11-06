// src/app/routes.ts
import type { RouteObject } from 'react-router-dom';
import React from 'react';

import ListaProducto from '../modules/Producto/Pages/ListaProducto';
import FormularioProducto from '../modules/Producto/Pages/FormularioProducto';
import DetalleProducto from '../modules/Producto/Pages/DetalleProducto';

const routes: RouteObject[] = [
  {
    path: '/productos',
    element: React.createElement(ListaProducto),
  },
  {
    path: '/productos/nuevo',
    element: React.createElement(FormularioProducto),
  },
  {
    path: '/productos/:id',
    element: React.createElement(DetalleProducto),
  },
  {
    path: '/productos/:id/editar',
    element: React.createElement(FormularioProducto),
  },
];

export default routes;

