import React, { useRef, useEffect, useState } from 'react';

interface Node3D {
  x: number;
  y: number;
  z: number;
  name: string;
  category: string;
  status: 'critical' | 'warning' | 'nominal';
  score: number;
  size: number;
}

export const SpatialRiskCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 260);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 260;
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Initial 3D Spatial Precursor Nodes across OIL Assets
    const nodes: Node3D[] = [
      { x: -90, y: -40, z: 20, name: 'Duliajan V-102', category: 'Separator Vessel', status: 'critical', score: 88, size: 7 },
      { x: 80, y: -60, z: -30, name: 'Rig OIL-45', category: 'Drop Zone Mast', status: 'critical', score: 92, size: 8 },
      { x: -60, y: 50, z: 40, name: 'Moran Skid B', category: 'LOTO Isolation', status: 'warning', score: 74, size: 6 },
      { x: 70, y: 40, z: 10, name: 'Naharkatiya-204', category: 'Wellhead Flange', status: 'nominal', score: 32, size: 5 },
      { x: 0, y: -10, z: 70, name: 'Baghjan Barrier', category: 'BOP Primary Annular', status: 'critical', score: 95, size: 9 },
      { x: -110, y: 10, z: -40, name: 'Digboi Tank 14', category: 'Confined Space', status: 'warning', score: 68, size: 6 },
      { x: 30, y: 70, z: -50, name: 'Jorhat Pipeline', category: 'Hot Work Permit', status: 'nominal', score: 28, size: 5 },
      { x: 100, y: 0, z: 60, name: 'Kumchai Deep Well', category: 'Gas Kick Precursor', status: 'warning', score: 79, size: 7 },
    ];

    let angleX = 0;
    let angleY = 0;
    let targetAngleX = 0;
    let targetAngleY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left - width / 2;
      const clientY = e.clientY - rect.top - height / 2;
      targetAngleY = (clientX / width) * 1.2;
      targetAngleX = -(clientY / height) * 1.2;
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    canvas.addEventListener('mousemove', onMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth interpolation for spatial tilt
      angleX += (targetAngleX - angleX) * 0.05;
      angleY += (targetAngleY - angleY + 0.003) * 0.05;

      const fov = 320;
      const cameraZ = 200;
      const centerX = width / 2;
      const centerY = height / 2;

      // Project 3D coordinates to 2D
      const projected = nodes.map((node) => {
        // Rotate around Y
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;

        // Rotate around X
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y1 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX;

        const scale = fov / (fov + z2 + cameraZ);
        const projX = centerX + x1 * scale;
        const projY = centerY + y1 * scale;

        return {
          ...node,
          projX,
          projY,
          scale,
          zDepth: z2,
        };
      });

      // Sort by depth (painter's algorithm)
      projected.sort((a, b) => b.zDepth - a.zDepth);

      // Draw connecting barrier laser threads
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.projX - b.projX;
          const dy = a.projY - b.projY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.25;
            ctx.beginPath();
            ctx.moveTo(a.projX, a.projY);
            ctx.lineTo(b.projX, b.projY);
            if (a.status === 'critical' || b.status === 'critical') {
              ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 1.5})`;
              ctx.lineWidth = 1;
            } else {
              ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
              ctx.lineWidth = 0.8;
            }
            ctx.stroke();
          }
        }
      }

      // Draw 3D nodes
      let foundHover: Node3D | null = null;
      projected.forEach((node) => {
        const radius = Math.max(3, node.size * node.scale);

        // Check hover
        const distToMouse = Math.sqrt(
          (mousePos.x - node.projX) ** 2 + (mousePos.y - node.projY) ** 2
        );
        if (distToMouse < radius + 8) {
          foundHover = node;
        }

        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.projX,
          node.projY,
          radius * 0.2,
          node.projX,
          node.projY,
          radius * 3.5
        );

        if (node.status === 'critical') {
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
          gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else if (node.status === 'warning') {
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
          gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.3)');
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
          gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.3)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.projX, node.projY, radius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(node.projX, node.projY, radius, 0, Math.PI * 2);
        ctx.fillStyle =
          node.status === 'critical'
            ? '#EF4444'
            : node.status === 'warning'
            ? '#F59E0B'
            : '#10B981';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pulsing radar ring for critical precursors
        if (node.status === 'critical') {
          const pulse = (Date.now() / 400) % 2;
          ctx.beginPath();
          ctx.arc(node.projX, node.projY, radius + pulse * 10, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239, 68, 68, ${Math.max(0, 1 - pulse / 2)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Label for prominent nodes
        if (node.scale > 0.85) {
          ctx.font = '600 10px Plus Jakarta Sans, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillText(node.name, node.projX + radius + 6, node.projY + 3);
        }
      });

      setHoveredNode(foundHover);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, [mousePos]);

  return (
    <div className="relative w-full h-[230px] rounded-2xl overflow-hidden bg-gradient-to-b from-black/40 to-black/10 border border-white/10 backdrop-blur-md flex items-center justify-center">
      {/* Dynamic 3D Spatial Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Spatial HUD Overlay */}
      <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2">
        <span className="pulse-dot pulse-dot-green" />
        <span className="text-[10px] font-bold tracking-wider uppercase text-white/80 font-mono">
          3D Spatial Risk Topology • 60fps
        </span>
      </div>

      <div className="absolute bottom-2.5 right-3 pointer-events-none text-[9px] font-mono text-white/50">
        Rotational Orbit: Interactive Parallax
      </div>

      {/* Floating Spatial Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-20 pointer-events-none p-2.5 rounded-xl bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl text-xs space-y-1 transition-all"
          style={{
            left: Math.min(mousePos.x + 12, 240),
            top: Math.max(mousePos.y - 45, 10),
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-white">{hoveredNode.name}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                hoveredNode.status === 'critical'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : hoveredNode.status === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {hoveredNode.status}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400">{hoveredNode.category}</div>
          <div className="text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 pt-0.5">
            <span>Risk Index:</span>
            <span className="font-bold text-white">{hoveredNode.score}/100</span>
          </div>
        </div>
      )}
    </div>
  );
};
