import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationStack } from './NotificationStack';

export function Layout() {
  const { token, user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">MasterTicket</div>
        <nav>
          <NavLink to="/">Events</NavLink>
          {token && <NavLink to="/my-tickets">My tickets</NavLink>}
        </nav>
        <div className="auth-zone">
          {token && user ? (
            <>
              <span className="role-pill">{user.role}</span>
              <span className="user-name">{user.fullName}</span>
              <button onClick={logout} type="button">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </div>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
      <NotificationStack />
    </div>
  );
}
