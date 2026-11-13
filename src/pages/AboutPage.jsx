import React from "react";
import { Sprout } from "lucide-react";
import "../styles/AboutPage.css";

export default function AboutPage({ navigate }) {
  return (
    <div className="about-page">
      <nav className="about-nav">
        <button className="about-brand" onClick={() => navigate("/")}>
          <Sprout size={22} color="#10b981" />
          FieldShift
        </button>
        <div className="about-nav-links">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
        </div>
      </nav>

      <main className="about-main">
        <p className="about-kicker">About / How it works</p>
        <h1>A field-level climate check for Ghana</h1>

        <section>
          <h2>Problem</h2>
          <p>
            A coastal field and a forest field do not share one national
            average. Farmers still have to pick a crop before the season, and
            a country-wide rainfall figure hides the place they actually farm.
          </p>
        </section>

        <section>
          <h2>NASA POWER data</h2>
          <p>
            FieldShift reads NASA POWER agroclimatology for the pin or the
            registered farm. The parameters are air temperature at 2 meters
            (T2M), corrected precipitation (PRECTOTCORR), and all-sky surface
            shortwave radiation (ALLSKY_SFC_SW_DWN), from the agriculture
            community (AG). Missing days marked -999 are left out.
          </p>
          <p>
            <a
              href="https://power.larc.nasa.gov/"
              target="_blank"
              rel="noreferrer"
            >
              NASA POWER source
            </a>
          </p>
        </section>

        <section>
          <h2>Method</h2>
          <p>
            The backend asks NASA for the previous full calendar year at that
            latitude and longitude. Annual rainfall is the mean of the valid
            daily values, times 365. Inside Ghana, a decision tree turns those
            figures into crop ideas, each with a reason and a confidence. A
            pin outside Ghana still returns the climate numbers, and the app
            says the location is outside the supported region instead of
            assigning a Ghana zone.
          </p>
          <p>
            The dashboard follows the region saved at registration. The map is
            for checking another place. The guest demo is a fixed Accra sample
            and does not call NASA.
          </p>
        </section>
      </main>
    </div>
  );
}
