import { FaFacebookF, FaTwitter, FaYoutube, FaInstagram } from "react-icons/fa";
import logoFerreteria from "../../assets/LogoFerreteriaCentral.png";

const Footer = () => {
  return (
    <footer className="bg-[#0b3b68] text-white w-full">
      {/* Contenido principal - más compacto */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-6 py-6 max-w-full">
        {/* Logo y descripción */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="bg-white rounded-full p-1.5 border-2 border-[#0b3b68] mb-2 flex items-center justify-center w-16 h-16">
            <img
              src={logoFerreteria}
              alt="Logo Ferretería Central"
              className="w-14 h-14 object-contain rounded-full"
            />
          </div>
          <h2 className="text-base font-bold leading-tight">FERRETERÍA CENTRAL</h2>
          <p className="text-xs text-gray-300 mt-1">
            Tu ferretería de confianza con todo lo que necesitas para tus proyectos.
          </p>
        </div>

        {/* Enlaces rápidos */}
        <div className="text-center md:text-left">
          <h3 className="font-bold mb-2 text-sm">ENLACES RÁPIDOS</h3>
          <ul className="space-y-1 text-gray-300 text-xs">
            <li><a href="#" className="hover:text-white transition">Inicio</a></li>
            <li><a href="#" className="hover:text-white transition">Productos</a></li>
            <li><a href="#" className="hover:text-white transition">Ofertas</a></li>
            <li><a href="#" className="hover:text-white transition">Nosotros</a></li>
            <li><a href="#" className="hover:text-white transition">Contacto</a></li>
          </ul>
        </div>

        {/* Horario */}
        <div className="text-center md:text-left">
          <h3 className="font-bold mb-2 text-sm">HORARIO DE ATENCIÓN</h3>
          <ul className="text-gray-300 text-xs space-y-0.5">
            <li>Lunes a Viernes: 8:00 am - 6:00 pm</li>
            <li>Sábado: 8:00 am - 4:00 pm</li>
            <li>Domingo: Cerrado</li>
          </ul>
        </div>

        {/* Contacto y redes */}
        <div className="text-center md:text-left">
          <h3 className="font-bold mb-2 text-sm">CONTÁCTANOS</h3>
          <p className="text-xs text-gray-300 mb-2">
            📍 Calle Central, Nicoya, Costa Rica <br />
            📞 +506 2685 1234 <br />
            ✉️ info@ferreteriacentral.cr
          </p>
          <div className="flex justify-center md:justify-start gap-3 text-lg">
            <a href="#" className="hover:text-gray-300 transition"><FaFacebookF /></a>
            <a href="#" className="hover:text-gray-300 transition"><FaInstagram /></a>
            <a href="#" className="hover:text-gray-300 transition"><FaTwitter /></a>
            <a href="#" className="hover:text-gray-300 transition"><FaYoutube /></a>
          </div>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="border-t border-gray-500 px-6 py-2 flex flex-col md:flex-row items-center justify-between text-xs text-gray-300 w-full">
        <p className="text-center md:text-left">
          © 2024 Ferretería Central. Todos los derechos reservados.
        </p>
        <div className="bg-white rounded-full p-0.5 mt-2 md:mt-0 flex items-center justify-center w-8 h-8">
          <img
            src={logoFerreteria}
            alt="Logo pequeño"
            className="w-7 h-7 object-contain rounded-full"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;