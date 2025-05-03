import { useOutletContext } from 'react-router-dom';

interface DarkModeContext {
  darkMode: boolean;
}

export function useDarkMode() {
  return useOutletContext<DarkModeContext>();
}