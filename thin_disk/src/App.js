import React, { useState } from "react";
import Plot from "react-plotly.js";

const AccretionDiskDensityProfile = () => {
  const [T, setT] = useState(1e7);
  const [mu, setMu] = useState(1);
  const [M, setM] = useState(100); // in solar masses

  // Constants
  const kB = 1.3807e-16;
  const mh = 1.6735575e-24;
  const G = 6.67e-8;
  const c = 2.99792458e10;
  const Msun = 1.989e33;

  const xValues = Array.from({ length: 100 }, (_, i) => i * 100 + 1); // avoid x=0
  const zValues = Array.from(
    { length: 100 },
    (_, i) => -5000 + i * (10000 / 99)
  );

  function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
  }

  const densityData = xValues.map((x) =>
    zValues.map((z) => {
      const rs = (2 * G * M * Msun) / (c * c);
      const denominator = Math.pow(x * rs, 3);
      if (denominator <= 0) return 0;

      const scaleHeight = Math.sqrt((G * M * Msun) / denominator);
      const exponent =
        (((-(scaleHeight ** 2) * (mu * mh)) / (kB * T)) * (z * rs) ** 2) / 2;

      if (!isFinite(exponent) || exponent < -700) return 0;

      return Math.exp(exponent);
    })
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Density Profile for Thin Accretion Disks
        </h1>
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div>
            <label className="block font-medium mb-2">
              Temperature T (K): {T.toExponential(1)}
            </label>
            <input
              type="range"
              min="1e6"
              max="1e8"
              step="1e6"
              value={T}
              onChange={(e) => setT(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block font-medium mb-2">
              Molecular Weight μ: {mu}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={mu}
              onChange={(e) => setMu(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block font-medium mb-2">
              Mass M (solar masses): {M}
            </label>
            <input
              type="range"
              min="1"
              max="200"
              step="1"
              value={M}
              onChange={(e) => setM(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Plot
            data={[
              {
                z: transpose(densityData),
                x: xValues,
                y: zValues,
                type: "contour",
                colorscale: [
                  [0, "rgb(255,255,255)"],
                  [0.2, "rgb(255,240,200)"],
                  [0.4, "rgb(255,200,120)"],
                  [0.6, "rgb(255,100,50)"],
                  [0.8, "rgb(200,30,0)"],
                  [1, "rgb(120,0,0)"],
                ],
                contours: { coloring: "heatmap" },
                colorbar: {
                  title: "ρ(z)/ρ(0)",
                  thickness: 20,
                  len: 0.75,
                  x: 1.05,
                },
              },
            ]}
            layout={{
              title: {
                text: "Normalized Density Profile ρ(z)/ρ(0)",
                font: { size: 24 },
              },
              xaxis: {
                showgrid: true,
                zeroline: false,
              },
              yaxis: {
                showgrid: true,
                zeroline: false,
              },
              annotations: [
                {
                  xref: "paper",
                  yref: "paper",
                  x: 0.5,
                  y: -0.18,
                  showarrow: false,
                  text: "x / rₛ (radius)",
                  font: { size: 18 },
                },
                {
                  xref: "paper",
                  yref: "paper",
                  x: -0.14,
                  y: 0.5,
                  showarrow: false,
                  text: "z / rₛ (height)",
                  textangle: -90,
                  font: { size: 18 },
                },
              ],
              autosize: true,
              margin: { l: 80, r: 100, b: 100, t: 60 },
              paper_bgcolor: "#f9fafb",
              plot_bgcolor: "#f9fafb",
              width: 800,
              height: 600,
            }}
            config={{ responsive: true }}
          />
        </div>
      </div>
    </div>
  );
};

export default AccretionDiskDensityProfile;
