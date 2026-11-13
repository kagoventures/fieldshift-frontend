import React from "react";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

function asNumber(value) {
  const number = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(number) ? number : null;
}

const METRICS = [
  {
    key: "avgTemp",
    label: "Avg temperature",
    unit: "°C",
    color: "#f59e0b",
  },
  {
    key: "totalRain",
    label: "Annual rainfall",
    unit: "mm",
    color: "#3b82f6",
  },
  {
    key: "avgSolar",
    label: "Solar radiation",
    unit: "kWh/m²",
    color: "#10b981",
  },
];

export default function ClimateChart({ telemetry }) {
  const metrics = METRICS.map((metric) => ({
    ...metric,
    value: asNumber(telemetry?.[metric.key]),
  })).filter((metric) => metric.value != null);

  if (metrics.length === 0) return null;

  return (
    <div className="climate-chart-block">
      <h3 className="climate-chart-heading">Climate snapshot</h3>
      <p className="climate-chart-note">
        Each chart has its own scale. Temperature, rainfall, and solar
        radiation are not compared on one axis.
      </p>
      <div className="climate-chart-grid">
        {metrics.map((metric) => (
          <div className="climate-chart-card" key={metric.key}>
            <div className="climate-chart-caption">
              {metric.label}: {metric.value} {metric.unit}
            </div>
            <Bar
              data={{
                labels: [metric.unit],
                datasets: [
                  {
                    data: [metric.value],
                    backgroundColor: metric.color,
                    borderRadius: 6,
                    maxBarThickness: 48,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (item) => `${item.parsed.y} ${metric.unit}`,
                    },
                  },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { color: "#475569" } },
                  x: { ticks: { color: "#475569" } },
                },
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
