// src/app/layout/Sidebar.tsx
import { Link } from 'react-router-dom';
import { 
  RiHome5Line, RiBox3Line, RiMoneyDollarCircleLine, RiShoppingCartLine,
  RiKeyLine, RiTeamLine, RiBarChartBoxLine, RiLineChartLine,
  RiFileList3Line, RiSettings4Line, RiPriceTag3Line
} from 'react-icons/ri';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6">
        <div className="mb-8 text-center">
          <p className="text-xl font-bold text-gray-800">Ferretería Central</p>
        </div>

        <nav>
          <ul className="space-y-1">
            {/* Misma lista de enlaces que ya tienes */}
            <li>
              <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiHome5Line className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Inicio</span>
              </Link>
            </li>
            <li>
              <Link to="/productos" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiBox3Line className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Productos</span>
              </Link>
            </li>
            <li>
              <Link to="/ventas" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiMoneyDollarCircleLine className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Ventas</span>
              </Link>
            </li>
            <li>
              <Link to="/compras" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiShoppingCartLine className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Compras</span>
              </Link>
            </li>
            <li>
              <Link to="/alquileres" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiKeyLine className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Alquileres</span>
              </Link>
            </li>
            <li>
              <Link to="/clientes" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiTeamLine className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Clientes</span>
              </Link>
            </li>
            <li>
              <Link to="/categorias" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiPriceTag3Line className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Categorías</span>
              </Link>
              
            </li>
            <li>
              <Link to="/proveedores" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiBarChartBoxLine className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Proveedores</span>
              </Link>
            </li>

            <li>
              <Link to="/reportes" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiLineChartLine className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Reportes</span>
              </Link>
            </li>
            <li>
              <Link to="/bitacora" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiFileList3Line className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Bitácora</span>
              </Link>
            </li>
            
            <li>
              <Link to="/configuracion" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition text-gray-700 hover:text-[#0b3b68]">
                <RiSettings4Line className="text-xl text-[#0b3b68]" />
                <span className="font-medium">Configuración</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>

  );
};

export default Sidebar;