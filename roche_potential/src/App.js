import React, { useState } from "react";
import Plot from "react-plotly.js";
import { Slider, Typography, Box } from "@mui/material";

// Constants
const G = 1.0; // Gravitational constant for simplicity
const gridSize = 200; // Grid resolution

// Compute Roche potential
function computePotential(m1, m2, a, omega, xRange, yRange) {
  const x = Array.from(
    { length: gridSize },
    (_, i) => xRange[0] + (i / (gridSize - 1)) * (xRange[1] - xRange[0])
  );
  const y = Array.from(
    { length: gridSize },
    (_, j) => yRange[0] + (j / (gridSize - 1)) * (yRange[1] - yRange[0])
  );

  // Compute potential (no absolute value, no normalization)
  const z = y.map((yj) =>
    x.map((xi) => {
      const x1 = (-a * m2) / (m1 + m2);
      const x2 = (a * m1) / (m1 + m2);
      const r1 = Math.hypot(xi - x1, yj);
      const r2 = Math.hypot(xi - x2, yj);
      const phi =
        (-G * m1) / r1 - (G * m2) / r2 - 0.5 * omega ** 2 * (xi ** 2 + yj ** 2);

      // Avoid singularity close to stars
      const epsilon = 0.05;
      if (r1 < epsilon || r2 < epsilon) {
        return 20.0;
      }

      return phi; // Return potential as it is
    })
  );

  const transformedZ = z.map((row) =>
    row.map((value) => Math.max(Math.log10(Math.abs(value)), 10 ** -6))
  );
  return { x, y, z: transformedZ };
}

// Compute Lagrange points
function estimateLagrangePoints(m1, m2, a) {
  const mu = m2 / (m1 + m2);
  const xL1 = a * (1 - 0.49 * Math.pow(mu, 1 / 3)); // Approximate
  const xL2 = a * (1 + 1.0 * Math.pow(mu, 1 / 3)); // Just outside second body
  const xL3 = -a * (1 + 1.0 * Math.pow(1 - mu, 1 / 3));
  const xCM = (a * (m1 - m2)) / (m1 + m2);

  const L1 = [xCM + (xL1 - a / 2), 0];
  const L2 = [xCM + (xL2 - a / 2), 0];
  const L3 = [xCM + (xL3 - a / 2), 0];
  const L4 = [xCM, (a * Math.sqrt(3)) / 2];
  const L5 = [xCM, (-a * Math.sqrt(3)) / 2];

  const maxLagrangeCoordinate = Math.max(
    Math.abs(L1[0]),
    Math.abs(L2[0]),
    Math.abs(L3[0]),
    Math.abs(L4[1]),
    Math.abs(L5[1])
  );

  // Set grid range based on max Lagrange point coordinate, scaling by 1.1
  const gridRange = Math.max(maxLagrangeCoordinate, 2 * a) * 1.1;
  const xRange = [-gridRange, gridRange];
  const yRange = [-gridRange, gridRange];

  return { L1, L2, L3, L4, L5, xRange, yRange };
}

export default function App() {
  const [m1, setM1] = useState(1);
  const [m2, setM2] = useState(1);
  const [a, setA] = useState(1);
  const [omega, setOmega] = useState(1);

  // Compute Lagrange points and dynamic ranges
  const { L1, L2, L3, L4, L5, xRange, yRange } = estimateLagrangePoints(
    m1,
    m2,
    a
  );

  // Compute Roche potential
  const { x, y, z } = computePotential(m1, m2, a, omega, xRange, yRange);

  // Normalize the potential for the heatmap
  const minPotential = Math.min(...z.flat());
  const maxPotential = Math.max(...z.flat());

  // Compute positions of the stars
  const x1 = (-a * m2) / (m1 + m2);
  const x2 = (a * m1) / (m1 + m2);

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        The Roche Potential (Co-Rotating Frame)
      </Typography>

      {/* Sliders */}
      <Box
        display="flex"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
      >
        <Box width="23%">
          <Typography gutterBottom>Mass 1: {m1.toFixed(2)}</Typography>
          <Slider
            min={0.1}
            max={5}
            step={0.1}
            value={m1}
            onChange={(_, v) => setM1(v)}
            sx={{ width: "100%" }}
          />
        </Box>
        <Box width="23%">
          <Typography gutterBottom>Mass 2: {m2.toFixed(2)}</Typography>
          <Slider
            min={0.1}
            max={5}
            step={0.1}
            value={m2}
            onChange={(_, v) => setM2(v)}
            sx={{ width: "100%" }}
          />
        </Box>
        <Box width="23%">
          <Typography gutterBottom>Separation (a): {a.toFixed(2)}</Typography>
          <Slider
            min={0.5}
            max={3}
            step={0.1}
            value={a}
            onChange={(_, v) => setA(v)}
            sx={{ width: "100%" }}
          />
        </Box>
        <Box width="23%">
          <Typography gutterBottom>
            Ang. Velocity (ω): {omega.toFixed(2)}
          </Typography>
          <Slider
            min={0.1}
            max={3}
            step={0.1}
            value={omega}
            onChange={(_, v) => setOmega(v)}
            sx={{ width: "100%" }}
          />
        </Box>
      </Box>

      {/* Plot */}
      <Box mt={4} display="flex" justifyContent="center">
        <Plot
          data={[
            {
              x,
              y,
              z,
              type: "contour",
              colorscale: "Earth",
              colorbar: {
                title: {
                  text: "|Φ|", // Correct way to define the title as an object
                  font: {
                    size: 20, // You can adjust this as needed
                  },
                },
                tickmode: "array",
                tickvals: [minPotential, maxPotential], // Include 0 in the ticks to balance the color scale
                ticktext: [
                  "min", // Label 0 for better visual indication of the neutral point
                  "max",
                ],
              },
              contours: {
                coloring: "heatmap",
                start: minPotential, // Set the minimum value for contouring
                end: maxPotential, // Set the maximum value for contouring
                size: (maxPotential - minPotential) / 50.0, // Adjust the spacing between contour levels
                showlabels: false,
                showlines: true,
                zmin: minPotential, // Set the minimum value of the heatmap
                zmax: maxPotential, // Set the maximum value of the heatmap
              },
            },
            {
              type: "scatter",
              mode: "markers",
              x: [x1, x2], // Star positions
              y: [0, 0], // Stars are on the x-axis (y = 0)
              marker: {
                color: "red",
                size: 12,
                symbol: "circle",
                line: { width: 2, color: "white" },
              },
              name: "Point Mass",
            },
          ]}
          layout={{
            width: 800,
            height: 600,
            title: "The Roche Potential",
            xaxis: { title: "x", scaleanchor: "y" },
            yaxis: { title: "y" },
            showlegend: true,
            margin: { l: 50, r: 50, t: 50, b: 50 },
            legend: {
              x: 0.145,
              y: 0.025,
              bgcolor: "rgba(255,255,255,0.6)",
              bordercolor: "black",
              borderwidth: 1,
            },
          }}
        />
      </Box>
    </Box>
  );
}
