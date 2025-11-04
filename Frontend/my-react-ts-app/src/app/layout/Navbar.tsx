import { FaUser, FaSearch } from "react-icons/fa";
import logoFerreteria from "../../assets/LogoFerreteriaCentral.png";

function Navbar() {
  return (
    <header className="w-full">
      {/* Barra superior gris */}
      <div className="bg-gray-300 text-[#0b3b68] text-center font-bold py-1 tracking-wide">
        FERRETERÍA CENTRAL
      </div>

      {/* Navbar azul */}
      <nav className="bg-[#0b3b68] flex items-center justify-between px-6 py-3">
        {/* Logo y texto */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img
              src={logoFerreteria}
              alt="Logo Ferretería Central"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="text-white font-bold text-lg">
            Todo para tu proyecto
          </div>
        </div>

        {/* Buscador y botón */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar"
              className="pl-9 pr-3 py-2 rounded-md outline-none border w-56 text-gray-700 bg-white placeholder-gray-500"
            />
          </div>
          <button className="flex items-center gap-2 bg-[#1f4e7a] hover:bg-[#255b8d] text-white px-4 py-2 rounded-md transition">
            <FaUser />
            <span>Admin</span>
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
