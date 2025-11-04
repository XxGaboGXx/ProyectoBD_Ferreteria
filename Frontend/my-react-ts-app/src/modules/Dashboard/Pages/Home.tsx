import { motion } from "framer-motion";
import { FaBoxOpen, FaShoppingCart, FaTools, FaClipboardList } from "react-icons/fa";

const Home = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Encabezado */}
      <div className=" from-[#0b3b68] to-[#1f4e7a] text-white rounded-xl p-8 shadow-lg">
        <h1 className="text-2xl text-center font-bold text-[#0b3b68]  mb-2">¡Bienvenido a Ferretería Central! 🛠️</h1>
        <p className="text-gray-700 text-center  max-w-2xl">
          En nuestro panel encontrarás toda la información necesaria para gestionar inventario,
          ventas y alquileres de manera rápida y eficiente. ¡Todo lo que necesitás para tu proyecto
          está aquí!
        </p>


      </div>

      {/* Tarjetas de información */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Stock Actual", value: "1,250 items", icon: <FaBoxOpen size={28} /> },
          { title: "Ventas Hoy", value: "$8,450", icon: <FaShoppingCart size={28} /> },
          { title: "Alquileres Activos", value: "7", icon: <FaTools size={28} /> },
        ].map((card, index) => (
          <motion.div
            key={index}
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer"
            whileHover={{ scale: 1.03 }}
          >
            <div className="flex items-center gap-3 text-[#0b3b68] mb-2">
              {card.icon}
              <h3 className="font-semibold text-lg">{card.title}</h3>
            </div>
            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Sección de descripción o información */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-[#0b3b68] mb-3">Sobre Ferretería Central</h2>
        <p className="text-gray-700 leading-relaxed">
          Somos una empresa dedicada a ofrecer soluciones completas para tus proyectos de
          construcción y mantenimiento. Nuestro compromiso es brindarte herramientas, materiales y
          asesoría de la más alta calidad. Desde el inventario hasta el alquiler de equipos,
          trabajamos para hacer tu gestión más fácil y eficiente.
        </p>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Consultar Inventario", icon: <FaClipboardList size={24} />, color: "bg-white text-blue-800" },
          { label: "Registrar Producto", icon: <FaBoxOpen size={24} />, color: "bg-white text-green-800" },
          { label: "Ver Reportes", icon: <FaShoppingCart size={24} />, color: "bg-white text-yellow-800" },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className={`flex flex-col items-center justify-center rounded-xl p-6 font-semibold shadow cursor-pointer hover:shadow-md transition ${action.color}`}
          >
            {action.icon}
            <span className="mt-2">{action.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Home;
