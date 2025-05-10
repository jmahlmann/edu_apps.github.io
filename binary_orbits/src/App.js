import React, { useEffect, useRef, useState } from "react";

const CanvasFrame = ({ frame, lockState }) => {
  const canvasRef = useRef(null);

  const radius = 30;
  const orbitRadius = 120;
  const massStar = 1;
  const massPlanet = 1;
  const totalMass = massStar + massPlanet;
  const distance = orbitRadius;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let angle = 0;

    const drawDashedCircle = (ctx, x, y, r) => {
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "gray";
      ctx.lineWidth = 1;
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawCOMDot = (ctx, x, y) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "black";
      ctx.fill();
    };

    const drawDisk = (ctx, x, y, r, color, rotationAngle) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      const lineX = x + r * Math.cos(rotationAngle);
      const lineY = y + r * Math.sin(rotationAngle);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(lineX, lineY);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      angle += 0.01;

      const omega = 0.01;
      const starCOMOffset = (massPlanet / totalMass) * distance;
      const planetCOMOffset = (massStar / totalMass) * distance;

      let starX, starY, planetX, planetY;
      let starRotation = 0;
      let planetRotation = 0;

      if (frame === "observer") {
        starX = centerX;
        starY = centerY;
        planetX = centerX + orbitRadius * Math.cos(angle);
        planetY = centerY + orbitRadius * Math.sin(angle);

        starRotation = angle;
        if (lockState === "synchronous") planetRotation = angle;
        else if (lockState === "static") planetRotation = 0;
        else if (lockState === "retrograde") planetRotation = -angle;

        drawDashedCircle(ctx, centerX, centerY, orbitRadius); // blue orbit
        drawDashedCircle(ctx, centerX, centerY, 0.5 * orbitRadius); // blue orbit
        drawCOMDot(
          ctx,
          centerX + 0.5 * orbitRadius * Math.cos(angle),
          centerY + 0.5 * orbitRadius * Math.sin(angle)
        );
      }

      if (frame === "centerOfMass") {
        starX = centerX - starCOMOffset * Math.cos(angle);
        starY = centerY - starCOMOffset * Math.sin(angle);
        planetX = centerX + planetCOMOffset * Math.cos(angle);
        planetY = centerY + planetCOMOffset * Math.sin(angle);

        starRotation = angle;
        if (lockState === "synchronous") planetRotation = angle;
        else if (lockState === "static") planetRotation = 0;
        else if (lockState === "retrograde") planetRotation = -angle;

        drawDashedCircle(ctx, centerX, centerY, starCOMOffset); // star orbit
        drawCOMDot(ctx, centerX, centerY);
      }

      if (frame === "coRotating") {
        starX = centerX - distance / 2;
        starY = centerY;
        planetX = centerX + distance / 2;
        planetY = centerY;

        starRotation = 0;
        if (lockState === "synchronous") planetRotation = 0;
        else if (lockState === "static") planetRotation = -angle;
        else if (lockState === "retrograde") planetRotation = -2 * angle;

        // Center of mass location between the two
        const comX =
          (massPlanet * starX + massStar * planetX) / (massStar + massPlanet);
        const comY = centerY;
        drawCOMDot(ctx, comX, comY);
      }

      drawDisk(ctx, starX, starY, radius, "orange", starRotation);
      drawDisk(ctx, planetX, planetY, radius, "lightblue", planetRotation);

      requestAnimationFrame(draw);
    };

    draw();
  }, [frame, lockState]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      style={{ border: "1px solid black" }}
    />
  );
};

const App = () => {
  const [lockState, setLockState] = useState("synchronous");

  return (
    <div>
      <h2>Companion rotation in different frames</h2>
      <div>
        <button onClick={() => setLockState("synchronous")}>
          Synchronized Rotation
        </button>
        <button onClick={() => setLockState("static")}>Static Companion</button>
        <button onClick={() => setLockState("retrograde")}>
          Retrograde Rotation
        </button>
        <h3>Current State: {lockState}</h3>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <h4>Observer Frame</h4>
          <CanvasFrame frame="observer" lockState={lockState} />
        </div>
        <div>
          <h4>Center of Mass Frame</h4>
          <CanvasFrame frame="centerOfMass" lockState={lockState} />
        </div>
        <div>
          <h4>Co-rotating Frame</h4>
          <CanvasFrame frame="coRotating" lockState={lockState} />
        </div>
      </div>
    </div>
  );
};

export default App;
