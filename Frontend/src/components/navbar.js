import React from "react";
import { NavLink } from "react-router-dom";
import "./navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">ProjectNest</div>
      <ul className="nav-links">
        <li><NavLink to="/homepage" className={({ isActive }) => isActive ? "active-link" : ""}>Home</NavLink></li>
        <li><a href="/homepage#features">Features</a></li>
        <li><a href="/homepage#how-it-works">How It Works</a></li>
        <li><a href="/homepage#contact">Contact</a></li>
      </ul>
      <div className="auth-buttons">
        <NavLink to="/login" className="nav-btn login">LOGIN</NavLink>
        <NavLink to="/register" className="nav-btn register">REGISTER</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;