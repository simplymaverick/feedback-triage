import { Link, NavLink } from "react-router-dom";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/" className="layout__brand">
          <img
            src="/offerzen-logo-white.svg"
            alt="OfferZen"
            className="layout__logo"
          />
          <span className="layout__subtitle">Feedback Triage</span>
        </Link>
        <nav className="layout__nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Submit
          </NavLink>
          <NavLink to="/feedback" className={({ isActive }) => (isActive ? "active" : "")}>
            All Feedback
          </NavLink>
        </nav>
      </header>
      <main className="layout__main">{children}</main>
    </div>
  );
}
