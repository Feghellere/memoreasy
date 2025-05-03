import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutenticacao } from '../contexto/AutenticacaoContexto';
import { Logo } from './Logo';
import {
  Home,
  BookOpen,
  PenTool,
  Network,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  FileText,
  Search,
  FlaskConical,
  Car as Cards,
  Menu,
  Settings,
  Package,
} from 'lucide-react';

interface SidebarProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}

export function Sidebar({ darkMode, setDarkMode, isExpanded, setIsExpanded }: SidebarProps) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { usuario, sair } = useAutenticacao();
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { path: '/app/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/app/gramatica', icon: FileText, label: 'Gramática' },
    { path: '/app/parafrase', icon: PenTool, label: 'Paráfrase' },
    { path: '/app/analisador', icon: Search, label: 'Analisador' },
    { path: '/app/gerador', icon: FlaskConical, label: 'Gerador' },
    { path: '/app/quiz', icon: BookOpen, label: 'Quiz' },
    { path: '/app/flashcards', icon: Cards, label: 'Flashcards' },
    { path: '/app/mapas', icon: Network, label: 'Mapa Mental' },
  ];

  const handleSair = async () => {
    try {
      setProfileModalOpen(false); // Close the profile modal first
      await sair(); // Wait for the logout to complete
      navigate('/login', { replace: true }); // Navigate to login page and replace the current history entry
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleProfileClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => setProfileModalOpen(true), 300);
    } else {
      setProfileModalOpen(!profileModalOpen);
    }
  };

  const UserMenu = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        absolute 
        bottom-full 
        right-0 
        mb-2 
        w-64 
        rounded-lg 
        shadow-lg 
        ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}
        border
        ${darkMode ? 'border-gray-700' : 'border-gray-200'}
      `}
    >
      <div className={`p-4 rounded-t-lg ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`
            w-10 
            h-10 
            rounded-full 
            flex 
            items-center 
            justify-center 
            flex-shrink-0
            ${darkMode ? 'bg-[#3D9CD3]' : 'bg-blue-600'} 
            text-white 
            font-medium
            overflow-hidden
            transition-all duration-300
          `}>
            {usuario?.fotoUrl ? (
              <img 
                src={usuario.fotoUrl} 
                alt="Foto de perfil" 
                className="w-full h-full object-cover object-center"
                loading="eager"
              />
            ) : (
              usuario?.nome?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {usuario?.nome}
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {usuario?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="p-2">
        <Link to="/app/configuracoes" className={`
          w-full flex items-center px-3 py-2 rounded-lg text-sm
          ${darkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100'}
          transition-colors
        `}>
          <Settings className="h-4 w-4 mr-3" />
          Configurações
        </Link>

        <button className={`
          w-full flex items-center px-3 py-2 rounded-lg text-sm
          ${darkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100'}
          transition-colors
        `}>
          <Package className="h-4 w-4 mr-3" />
          Plano Gratuito
        </button>

        <div className={`my-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

        <div className={`
          flex items-center justify-between px-3 py-2 rounded-lg
          ${darkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100'}
        `}>
          <div className="flex items-center text-sm">
            {darkMode ? <Moon className="h-4 w-4 mr-3" /> : <Sun className="h-4 w-4 mr-3" />}
            Modo {darkMode ? 'Escuro' : 'Claro'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDarkMode(!darkMode);
            }}
            className={`
              relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent 
              transition-colors duration-200 ease-in-out focus:outline-none
              ${darkMode ? 'bg-[#3D9CD3]' : 'bg-gray-200'}
            `}
          >
            <span className={`
              pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out 
              ${darkMode ? 'translate-x-4' : 'translate-x-0'}
            `} />
          </button>
        </div>

        <div className={`my-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

        <button
          onClick={handleSair}
          className={`
            w-full flex items-center px-3 py-2 rounded-lg text-sm
            ${darkMode ? 'text-red-400 hover:bg-gray-700/50' : 'text-red-600 hover:bg-gray-100'}
            transition-colors
          `}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sair
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      <button
        onClick={toggleSidebar}
        className={`
          lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg
          ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
          shadow-lg
        `}
      >
        <Menu className="h-6 w-6" />
      </button>

      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <motion.div
        initial={false}
        animate={{
          width: isExpanded ? '256px' : '72px',
          x: isMobile && !isExpanded ? '-100%' : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`
          fixed top-0 left-0 h-full
          ${darkMode ? 'bg-[#121827]' : 'bg-white'}
          flex flex-col border-r
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          z-40 overflow-hidden
        `}
      >
        <div className="p-4 relative flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#3D9CD3] to-[#2D8BA8] rounded flex items-center justify-center">
                  <Logo className="h-6 w-6 text-white" />
                </div>
                <span className={`ml-3 text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  MemorEasy
                </span>
              </motion.div>
            ) : (
              <motion.button
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleSidebar}
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}
                  transition-colors
                `}
              >
                <ChevronRight className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </motion.button>
            )}
          </AnimatePresence>

          {isExpanded && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className={`
                w-8 h-8 rounded-lg
                ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}
                flex items-center justify-center transition-colors
              `}
            >
              <ChevronLeft className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </motion.button>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center justify-center lg:justify-start 
                  px-3 py-2 rounded-lg transition-all duration-200
                  ${isActive
                    ? darkMode
                      ? 'bg-[#3D9CD3] text-white'
                      : 'bg-blue-100 text-blue-900'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="ml-3 whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        <div 
          ref={profileRef}
          className={`
            relative 
            ${isExpanded ? 'p-4' : 'py-4'}
            border-t 
            ${!isExpanded && 'flex justify-center items-center'}
            ${darkMode ? 'border-gray-700' : 'border-gray-200'}
            transition-all duration-300
          `}
        >
          <div className={`
            flex 
            items-center 
            ${isExpanded ? 'px-3 py-2' : 'p-1.5'} 
            ${isExpanded ? 'space-x-3' : ''} 
            cursor-pointer
            rounded-lg
            ${!isExpanded && 'flex justify-center items-center'}
            ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100'}
            transition-all duration-300
          `}
          onClick={handleProfileClick}
          >
            <div className={`
              ${isExpanded ? 'w-8 h-8' : 'w-7 h-7'}
              rounded-full 
              flex 
              items-center 
              justify-center 
              flex-shrink-0
              ${darkMode ? 'bg-[#3D9CD3]' : 'bg-blue-600'} 
              text-white font-medium
              overflow-hidden
              transition-all duration-300
            `}>
              {usuario?.fotoUrl ? (
                <img 
                  src={usuario.fotoUrl} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
              ) : (
                usuario?.nome?.charAt(0).toUpperCase()
              )}
            </div>
            {isExpanded && (
              <div className="flex-1 overflow-hidden">
                <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {usuario?.nome}
                </p>
              </div>
            )}
          </div>
          
          <AnimatePresence>
            {isExpanded && profileModalOpen && <UserMenu />}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}