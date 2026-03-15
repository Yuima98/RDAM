/**
 * CitizenLayout.jsx / InternalLayout.jsx
 *
 * Wrappers de layout para cada portal.
 * Usan <Outlet /> de React Router v6 para renderizar la página hija.
 *
 * La estructura es:
 *   <div.app-layout>
 *     <TopHeader />
 *     <div.body-wrapper>
 *       <Sidebar portal="citizen|internal" />
 *       <main.main-content>
 *         <Outlet />   ← aquí se renderiza la página
 *       </main>
 *     </div>
 *   </div>
 *
 * Al navegar entre páginas del mismo portal, el layout NO se re-monta
 * (React Router v6 mantiene el componente padre vivo), por lo que el
 * sidebar y el header no parpadean al cambiar de ruta.
 */

import { Outlet } from 'react-router-dom';
import TopHeader from './TopHeader';
import Sidebar from './Sidebar';

function AppShell({ portal, portalLabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopHeader portalLabel={portalLabel} />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar portal={portal} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function CitizenLayout() {
  return <AppShell portal="citizen" portalLabel="Portal Ciudadano" />;
}

export function InternalLayout() {
  return <AppShell portal="internal" portalLabel="Portal Interno" />;
}

// Re-exportar como default CitizenLayout para compatibilidad con AppRouter
export default CitizenLayout;
