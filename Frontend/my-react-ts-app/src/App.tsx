// src/App.tsx
import MainLayout from './app/layout/MainLayout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './modules/Dashboard/Pages/Home'; // 👈 Tu página de inicio
import ListaProducto from './modules/Producto/Pages/ListaProducto';
import FormularioProducto from './modules/Producto/Pages/FormularioProducto';
import DetalleProducto from './modules/Producto/Pages/DetalleProducto';
import ListaVenta from './modules/Venta/Pages/ListaVenta';
import FormularioVenta from './modules/Venta/Pages/FormularioVenta';
import DetalleVenta from './modules/Venta/Pages/DetalleVenta';
import ListaCompra from './modules/Compra/Pages/ListaCompra';
import DetalleCompra from './modules/Compra/Pages/DetalleCompra';
import FormularioCompra from './modules/Compra/Pages/FormularioCompra';
import ListaAlquiler from './modules/Alquiler/Pages/ListaAlquiler';
import FormularioAlquiler from './modules/Alquiler/Pages/FormularioAlquiler';
import DetalleAlquiler from './modules/Alquiler/Pages/DetalleAlquiler';
import ListaCliente from './modules/Cliente/Pages/ListaCliente';
import FormularioCliente from './modules/Cliente/Pages/FormularioCliente';
import DetalleCliente from './modules/Cliente/Pages/DetalleCliente';
import ListaColaborador from './modules/Colaborador/Pages/ListaColaborador';
import ListaProveedor from './modules/Proveedor/Pages/ListaProveedor';
import ListaCategoria from './modules/Categoria/Pages/ListaCategoria';
import DetalleCategoria from './modules/Categoria/Pages/DetalleCategoria';
import FormularioCategoria from './modules/Categoria/Pages/FormularioCategoria';
import FormularioProveedor from './modules/Proveedor/Pages/FormularioProveedor';
import DetalleProveedor from './modules/Proveedor/Pages/DetalleProveedor';
import ListaBitacora from './modules/Bitacora/Pages/ListaBitacora';
import ReportesList from './modules/Reporte/Pages/ListaReporte';


function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Productos */}
          <Route path="/productos" element={<ListaProducto />} />
          <Route path="/productos/nuevo" element={<FormularioProducto />} />
          <Route path="/productos/:id" element={<DetalleProducto />} />
          <Route path="/productos/:id/editar" element={<FormularioProducto />} />
          {/* Ventas */}
          <Route path="/ventas" element={<ListaVenta />} />
          <Route path="/ventas/nuevo" element={<FormularioVenta />} />
          <Route path="/ventas/:id" element={<DetalleVenta />} />
          <Route path="/ventas/:id/editar" element={<FormularioVenta />} />
          {/* Compras */}
          <Route path="/compras" element={<ListaCompra />} />
          <Route path="/compras/nuevo" element={<FormularioCompra />} />
          <Route path="/compras/:id" element={<DetalleCompra />} />
          <Route path="/compras/:id/editar" element={<FormularioCompra />} />
          {/* Alquileres */}
          <Route path="/alquileres" element={<ListaAlquiler />} />
          <Route path="/alquileres/nuevo" element={<FormularioAlquiler />} />
          <Route path="/alquileres/:id" element={<DetalleAlquiler />} />
          <Route path="/alquileres/:id/editar" element={<FormularioAlquiler />} />
          {/* Clientes */}
          <Route path="/clientes" element={<ListaCliente />} />
          <Route path="/clientes/nuevo" element={<FormularioCliente />} />
          <Route path="/clientes/:id" element={<DetalleCliente />} />
          <Route path="/clientes/:id/editar" element={<FormularioCliente />} />
          <Route path="/colaboradores/*" element={<ListaColaborador />} />
          {/* Proveedores */}
          <Route path="/proveedores" element={<ListaProveedor />} />
            {/* Categorías */}
            <Route path="/categorias" element={<ListaCategoria />} />
            <Route path="/categorias/nuevo" element={<FormularioCategoria />} />
            <Route path="/categorias/:id" element={<DetalleCategoria />} />
            <Route path="/categorias/:id/editar" element={<FormularioCategoria />} />
          <Route path="/proveedores/nuevo" element={<FormularioProveedor />} />
          <Route path="/proveedores/:id" element={<DetalleProveedor />} />
          <Route path="/proveedores/:id/editar" element={<FormularioProveedor />} />
          {/* Reportes */}
          <Route path="/reportes" element={<ReportesList />} />
          {/* Bitácora */}
          <Route path="/bitacora" element={<ListaBitacora />} />
         

         
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;