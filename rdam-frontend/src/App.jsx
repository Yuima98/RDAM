/**
 * App.jsx
 *
 * Raíz de la aplicación. Envuelve todo en AuthProvider para que
 * cualquier componente hijo pueda usar useAuth().
 *
 * AppRouter va DENTRO de AuthProvider porque los guards (ProtectedRoute,
 * RoleRoute) necesitan acceder al contexto de autenticación, y React Router
 * necesita BrowserRouter para que los hooks de navegación funcionen.
 * El BrowserRouter está declarado dentro de AppRouter.
 */

import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import './styles/globals.css';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
