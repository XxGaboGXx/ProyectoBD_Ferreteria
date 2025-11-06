// src/app/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { 
  RiHome5Line, 
  RiBox3Line, 
  RiMoneyDollarCircleLine, 
  RiShoppingCartLine,
  RiKeyLine, 
  RiTeamLine, 
  RiBarChartBoxLine, 
  RiLineChartLine,
  RiPriceTag3Line,
  RiDatabase2Line // ✅ Icono para Backups
} from 'react-icons/ri';

const Sidebar = () => {
  const menuItems = [
    { icon: RiHome5Line, label: 'Inicio', path: '/' },
    { icon: RiBox3Line, label: 'Productos', path: '/productos' },
    { icon: RiMoneyDollarCircleLine, label: 'Ventas', path: '/ventas' },
    { icon: RiShoppingCartLine, label: 'Compras', path: '/compras' },
    { icon: RiKeyLine, label: 'Alquileres', path: '/alquileres' },
    { icon: RiTeamLine, label: 'Clientes', path: '/clientes' },
    { icon: RiPriceTag3Line, label: 'Categorías', path: '/categorias' },
    { icon: RiBarChartBoxLine, label: 'Proveedores', path: '/proveedores' },
    { icon: RiLineChartLine, label: 'Reportes', path: '/reportes' },
    { icon: RiDatabase2Line, label: 'Backups', path: '/backups' }, // ✅ NUEVO
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <p className="text-xl font-bold text-gray-800">Ferretería Central</p>
        </div>

        {/* Navegación */}
        <nav>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                        isActive
                          ? 'bg-[#0b3b68] text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-[#0b3b68]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon 
                          className={`text-xl ${
                            isActive ? 'text-white' : 'text-[#0b3b68]'
                          }`} 
                        />
                        <span className="font-medium">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;