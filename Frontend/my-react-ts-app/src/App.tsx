// src/App.tsx
import MainLayout from './app/layout/MainLayout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './modules/Dashboard/Pages/Home'; // 👈 Tu página de inicio
import ListaProducto from './modules/Producto/Pages/ListaProducto';
import ListaVenta from './modules/Venta/Pages/ListaVenta';
import ListaCompra from './modules/Compra/Pages/ListaCompra';
import ListaAlquiler from './modules/Alquiler/Pages/ListaAlquiler';
import ListaCliente from './modules/Cliente/Pages/ListaCliente';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos/*" element={<ListaProducto />} />
          <Route path="/ventas/*" element={<ListaVenta />} />
          <Route path="/compras/*" element={<ListaCompra />} />
          <Route path="/alquileres/*" element={<ListaAlquiler />} />
          <Route path="/clientes/*" element={<ListaCliente />} />
          {/* Agrega más rutas aquí */}
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;