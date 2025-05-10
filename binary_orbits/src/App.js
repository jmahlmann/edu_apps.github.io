import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

function BinaryOrbit({ massRatio, eccentricity, playbackSpeed, frameType }) {
  const ref1 = useRef();
  const ref2 = useRef();
  const trail1 = useRef([]);
  const trail2 = useRef([]);
  const trailCom = useRef([]);
  const trailBlackMarker = useRef([]); // Ref to track the black marker's trail
  const [theta, setTheta] = useState(0);

  const maxTrailLength = 300;
  const a = 5;
  const e = eccentricity;
  const mu = massRatio / (1 + massRatio);

  const lineRef1 = useRef();
  const lineRef2 = useRef();
  const lineRefCom = useRef();
  const lineRefBlackMarker = useRef(); // Ref for black marker's trail line
  const connectorRef = useRef();
  const blackMarkerRef = useRef();

  const timeRef = useRef(0);

  useEffect(() => {
    // Reset the state every time the frame type changes
    trail1.current = [];
    trail2.current = [];
    trailCom.current = [];
    trailBlackMarker.current = []; // Reset black marker's trail
    setTheta(0);
    timeRef.current = 0; // Reset time
    if (blackMarkerRef.current) {
      blackMarkerRef.current.position.set(0, 0, 0); // Reset black marker position
    }
  }, [frameType, massRatio, eccentricity, playbackSpeed]);

  useFrame((state, delta) => {
    timeRef.current += delta * playbackSpeed;
    const omega = playbackSpeed;
    const dtheta = omega * delta;
    const newTheta = theta + dtheta;
    setTheta(newTheta);

    const r = (a * (1 - e ** 2)) / (1 + e * Math.cos(newTheta));
    const x = r * Math.cos(newTheta);
    const y = r * Math.sin(newTheta);

    const pos1 = new THREE.Vector3(-mu * x, -mu * y, 0);
    const pos2 = new THREE.Vector3((1 - mu) * x, (1 - mu) * y, 0);

    let rotMatrix = new THREE.Matrix4();
    if (frameType === "corotating") {
      rotMatrix.makeRotationZ(-newTheta);
      pos1.applyMatrix4(rotMatrix);
      pos2.applyMatrix4(rotMatrix);
    } else if (frameType === "observer") {
      // Observer frame: Apply the figure-eight motion for both masses
      const translationFactor = Math.sin(timeRef.current) * 0.5;
      pos1.x += translationFactor;
      pos2.x -= translationFactor;

      // Move the black marker (center of mass) with the system in the observer frame
      const comX = mu * pos1.x + (1 - mu) * pos2.x;
      const comY = mu * pos1.y + (1 - mu) * pos2.y;
      if (blackMarkerRef.current) {
        blackMarkerRef.current.position.set(comX, comY, 0);
      }

      // Update the black marker's trail
      trailBlackMarker.current.push(new THREE.Vector3(comX, comY, 0));
      if (trailBlackMarker.current.length > maxTrailLength)
        trailBlackMarker.current.shift();
    }

    ref1.current.position.copy(pos1);
    ref2.current.position.copy(pos2);

    const com = new THREE.Vector3(0, 0, 0);

    trail1.current.push(pos1.clone());
    trail2.current.push(pos2.clone());
    trailCom.current.push(com.clone());

    if (trail1.current.length > maxTrailLength) trail1.current.shift();
    if (trail2.current.length > maxTrailLength) trail2.current.shift();
    if (trailCom.current.length > maxTrailLength) trailCom.current.shift();

    const updateLine = (lineRef, trail) => {
      const positions = new Float32Array(trail.flatMap((p) => [p.x, p.y, p.z]));
      lineRef.current.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
    };

    if (lineRef1.current) updateLine(lineRef1, trail1.current);
    if (lineRef2.current) updateLine(lineRef2, trail2.current);
    if (lineRefCom.current) updateLine(lineRefCom, trailCom.current);

    // Update the black marker trail line in observer frame
    if (frameType === "observer" && lineRefBlackMarker.current) {
      updateLine(lineRefBlackMarker, trailBlackMarker.current);
    }

    if (frameType !== "corotating" && connectorRef.current) {
      const positionsConnector = new Float32Array([
        pos1.x,
        pos1.y,
        pos1.z,
        pos2.x,
        pos2.y,
        pos2.z,
      ]);
      connectorRef.current.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positionsConnector, 3)
      );
    }
  });

  return (
    <>
      {/* Particle Trajectories */}
      <line ref={lineRef1}>
        <bufferGeometry />
        <lineBasicMaterial attach="material" color="blue" />
      </line>
      <line ref={lineRef2}>
        <bufferGeometry />
        <lineBasicMaterial attach="material" color="red" />
      </line>

      {/* COM trajectory (only in inertial frame) */}
      {frameType !== "corotating" && (
        <line ref={lineRefCom}>
          <bufferGeometry />
          <lineBasicMaterial attach="material" color="green" />
        </line>
      )}

      {/* Black marker trajectory (only in observer frame) */}
      {frameType === "observer" && (
        <line ref={lineRefBlackMarker}>
          <bufferGeometry />
          <lineBasicMaterial attach="material" color="black" />
        </line>
      )}

      {/* Masses */}
      <mesh ref={ref1}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      <mesh ref={ref2}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="red" />
      </mesh>

      {/* Connector (not in corotating frame) */}
      {frameType !== "corotating" && (
        <line ref={connectorRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, 0, 0, 0, 0, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="gray" />
        </line>
      )}

      {/* Center of mass (always a black dot) */}
      <mesh ref={blackMarkerRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
    </>
  );
}

function App() {
  const [massRatio, setMassRatio] = useState(1);
  const [eccentricity, setEccentricity] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [frameType, setFrameType] = useState("no"); // "corotating", "center-of-mass", or "observer"

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ height: "100vh", width: "100%" }}
      >
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <BinaryOrbit
          massRatio={massRatio}
          eccentricity={eccentricity}
          playbackSpeed={playbackSpeed}
          frameType={frameType}
        />
        <OrbitControls />
      </Canvas>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          fontSize: "24px",
          fontWeight: "bold",
          color: "black",
        }}
      >
        Dynamics of binary systems in different frames
      </div>

      {/* Controls */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 10,
          background: "rgba(255, 255, 255, 0.8)",
          padding: "10px",
          borderRadius: "8px", // Fixed borderRadius string
        }}
      >
        <label>
          Mass Ratio:
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={massRatio}
            onChange={(e) => setMassRatio(parseFloat(e.target.value))}
          />
          {massRatio.toFixed(1)}
        </label>
        <br />
        <label>
          Eccentricity:
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            value={eccentricity}
            onChange={(e) => setEccentricity(parseFloat(e.target.value))}
          />
          {eccentricity.toFixed(2)}
        </label>
        <br />
        <label>
          Playback Speed:
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
          />
          {playbackSpeed.toFixed(1)}
        </label>
        <br />
        <label>
          Frame Selection:
          <select
            value={frameType}
            onChange={(e) => setFrameType(e.target.value)}
          >
            <option value="no">Center-of-Mass Frame</option>
            <option value="corotating">Corotating Frame</option>
            <option value="observer">Observer Frame</option>
          </select>
        </label>
      </div>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 10,
          background: "rgba(255, 255, 255, 0.8)",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <div style={{ color: "blue" }}>
          • Mass <InlineMath math="m_1" />
        </div>
        <div style={{ color: "red" }}>
          • Mass <InlineMath math="m_2" />
        </div>
        <div style={{ color: "black" }}>• Center of mass</div>
      </div>
    </>
  );
}

export default App;
