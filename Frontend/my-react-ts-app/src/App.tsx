// src/App.tsx
import MainLayout from './app/layout/MainLayout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './modules/Dashboard/Pages/Home'; // 👈 Tu página de inicio

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Agrega más rutas aquí */}
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;