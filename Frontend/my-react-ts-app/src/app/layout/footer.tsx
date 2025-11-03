import { FaFacebookF, FaTwitter, FaYoutube } from "react-icons/fa";
import logoFerreteria from "../../assets/LogoFerreteriaCentral.png";

const Footer = () => {
  return (
    <footer className="bg-[#0b3b68] text-white mt-10">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between px-6 py-6 max-w-6xl mx-auto">
        {/* Logo y texto */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="bg-white rounded-full p-2 border-4 border-[#0b3b68] mb-2">
            <img
              src={logoFerreteria}
              alt="Logo Ferretería Central"
              className="w-20 h-20 object-contain"
            />
          </div>
          <h2 className="text-lg font-bold leading-tight">FERRETERÍA CENTRAL</h2>
          <p className="text-sm text-gray-300 mt-1">
            Construcción, Hogar, Bricolaje
          </p>
        </div>

        {/* Sección de contacto */}
        <div className="text-center md:text-left mt-5 md:mt-0">
          <h3 className="font-bold mb-2">CONTACTO</h3>
          <p className="text-sm text-gray-300">
            Stat 2124 71 Ancian, Lla 20629 <br />
            +233 446 898 <br />
            temailceretuectco@mail.cour
          </p>
        </div>

        {/* Redes sociales */}
        <div className="text-center md:text-right mt-5 md:mt-0">
          <h3 className="font-bold mb-2">SÍGUENOS</h3>
          <div className="flex justify-center md:justify-end gap-3 text-xl">
            <a href="#" className="hover:text-gray-300">
              <FaFacebookF />
            </a>
            <a href="#" className="hover:text-gray-300">
              <FaTwitter />
            </a>
            <a href="#" className="hover:text-gray-300">
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="border-t border-gray-500 mt-4 px-6 py-3 flex items-center justify-between text-sm text-gray-300 max-w-6xl mx-auto">
        <p>© 2024 Ferretería Central. Todos los derechos reservados.</p>
        <div className="bg-white rounded-full p-1">
          <img src="/logo.png" alt="Logo pequeño" className="w-8 h-8 object-contain" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
