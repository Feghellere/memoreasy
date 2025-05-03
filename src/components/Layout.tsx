import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [darkMode, setDarkMode] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`min-h-screen ${
      darkMode 
        ? 'bg-gradient-to-br from-[#0B1120] to-[#121e36]' 
        : 'bg-gradient-to-br from-gray-50 to-white'
    }`}>
      <Sidebar 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      <main 
        className={`
          min-h-screen 
          transition-all 
          duration-300 
          ease-in-out
          ${isExpanded ? 'lg:pl-64' : 'lg:pl-20'}
          pl-20
          pt-16
          lg:pt-6
          px-4
          sm:px-6
          lg:px-8
        `}
      >
        <div className="h-full">
          <Outlet context={{ darkMode }} />
        </div>
      </main>
    </div>
  );
}