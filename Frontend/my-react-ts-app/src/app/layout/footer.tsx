import { FaFacebookF, FaTwitter, FaYoutube, FaInstagram } from "react-icons/fa";
import logoFerreteria from "../../assets/LogoFerreteriaCentral.png";

const Footer = () => {
  return (
    <footer className="bg-[#0b3b68] text-white mt-10 w-full">
      {/* Contenido principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 py-10 max-w-7xl mx-auto">
        {/* Logo y descripción */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="bg-white rounded-full p-2 border-4 border-[#0b3b68] mb-3 flex items-center justify-center w-24 h-24">
            <img
              src={logoFerreteria}
              alt="Logo Ferretería Central"
              className="w-20 h-20 object-contain rounded-full"
            />
          </div>
          <h2 className="text-lg font-bold leading-tight">FERRETERÍA CENTRAL</h2>
          <p className="text-sm text-gray-300 mt-2">
            Tu ferretería de confianza con todo lo que necesitas para tus proyectos
            de construcción, remodelación y hogar.
          </p>
        </div>

        {/* Enlaces rápidos */}
        <div className="text-center md:text-left">
          <h3 className="font-bold mb-3 text-lg">ENLACES RÁPIDOS</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li><a href="#" className="hover:text-white transition">Inicio</a></li>
            <li><a href="#" className="hover:text-white transition">Productos</a></li>
            <li><a href="#" className="hover:text-white transition">Ofertas</a></li>
            <li><a href="#" className="hover:text-white transition">Nosotros</a></li>
            <li><a href="#" className="hover:text-white transition">Contacto</a></li>
          </ul>
        </div>

        {/* Horario */}
        <div className="text-center md:text-left">
          <h3 className="font-bold mb-3 text-lg">HORARIO DE ATENCIÓN</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>Lunes a Viernes: 8:00 am - 6:00 pm</li>
            <li>Sábado: 8:00 am - 4:00 pm</li>
            <li>Domingo: Cerrado</li>
          </ul>
        </div>

        {/* Contacto y redes */}
        <div className="text-center md:text-left">
          <h3 className="font-bold mb-3 text-lg">CONTÁCTANOS</h3>
          <p className="text-sm text-gray-300 mb-4">
            📍 Calle Central, Nicoya, Costa Rica <br />
            📞 +506 2685 1234 <br />
            ✉️ info@ferreteriacentral.cr
          </p>
          <div className="flex justify-center md:justify-start gap-4 text-2xl">
            <a href="#" className="hover:text-gray-300 transition"><FaFacebookF /></a>
            <a href="#" className="hover:text-gray-300 transition"><FaInstagram /></a>
            <a href="#" className="hover:text-gray-300 transition"><FaTwitter /></a>
            <a href="#" className="hover:text-gray-300 transition"><FaYoutube /></a>
          </div>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="border-t border-gray-500 px-6 py-3 flex flex-col md:flex-row items-center justify-between text-sm text-gray-300 w-full">
        <p className="text-center md:text-left">
          © 2024 Ferretería Central. Todos los derechos reservados.
        </p>
        <div className="bg-white rounded-full p-1 mt-3 md:mt-0 flex items-center justify-center w-10 h-10">
          <img
            src={logoFerreteria}
            alt="Logo pequeño"
            className="w-8 h-8 object-contain rounded-full"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
