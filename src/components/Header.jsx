import React from "react";
import { ShieldCheck, User } from "lucide-react";
import "../styles/Header.css";
import { isDemoMode } from "../lib/demo";

export default function Header({ userEmail }) {
  const demo = isDemoMode();
  return (
    <header className="app-header">
      <div className="header-left">
        <span className="header-badge">
          <ShieldCheck size={13} />{" "}
          {demo ? "Guest demo — sample data, not live NASA POWER" : "NASA POWER API Connected"}
        </span>
      </div>

      <div className="header-right">
        <User size={16} />
        <span className="header-user-email">
          {demo ? "Guest" : userEmail || "farmer@spaceapps.org"}
        </span>
      </div>
    </header>
  );
}