// src/modules/Dashboard/Pages/Home.tsx


const Home = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bienvenido a Ferretería Central</h1>
      <p>Este es tu dashboard principal.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Stock Actual</h3>
          <p className="text-2xl">1,250 items</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Ventas Hoy</h3>
          <p className="text-2xl">$8,450</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Alquileres Activos</h3>
          <p className="text-2xl">7</p>
        </div>
      </div>
    </div>
  );
};

export default Home;