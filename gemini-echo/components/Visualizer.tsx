
import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const pointsRef = useRef<{ angle: number; currentRadius: number; targetRadius: number }[]>([]);

  // Initialize points for the blob once
  useEffect(() => {
    const numPoints = 180; // More points for smoother edge
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push({
        angle,
        currentRadius: 100,
        targetRadius: 100,
      });
    }
    pointsRef.current = points;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser?.frequencyBinCount || 128;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.12;

      ctx.clearRect(0, 0, width, height);

      const points = pointsRef.current;
      if (points.length === 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      if (isActive && analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      // Calculate overall intensity for a global "pulse" effect
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const avgIntensity = sum / (bufferLength * 255);

      // Update points
      points.forEach((p, i) => {
        // Map dataArray index to point index with some smoothing
        // We use the lower half of frequencies for better visual "water" weight
        const freqIndex = Math.floor((i / points.length) * (bufferLength / 2));
        const intensity = dataArray[freqIndex] / 255;
        
        // Active motion: frequency-based deformation
        // Idle motion: perfect circle (no ripple when inactive)
        const deformation = isActive ? (intensity * 40 + avgIntensity * 20) : 0;
        
        p.targetRadius = baseRadius + deformation;
        
        // Elastic smoothing for liquid feel
        p.currentRadius += (p.targetRadius - p.currentRadius) * 0.12;
      });

      // Draw the blob
      ctx.beginPath();
      
      const firstX = centerX + points[0].currentRadius * Math.cos(points[0].angle);
      const firstY = centerY + points[0].currentRadius * Math.sin(points[0].angle);
      ctx.moveTo(firstX, firstY);

      // Draw smooth curves through points
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        const x1 = centerX + p1.currentRadius * Math.cos(p1.angle);
        const y1 = centerY + p1.currentRadius * Math.sin(p1.angle);
        const x2 = centerX + p2.currentRadius * Math.cos(p2.angle);
        const y2 = centerY + p2.currentRadius * Math.sin(p2.angle);

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        ctx.quadraticCurveTo(x1, y1, midX, midY);
      }

      ctx.closePath();

      // Style: Perfect monochromatic black
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Sharp edge
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, isActive]);

  return (
    <div className="relative flex items-center justify-center w-full max-w-lg aspect-square">
        <canvas 
            ref={canvasRef} 
            width={800} 
            height={800} 
            className="w-full h-full relative z-10"
        />
    </div>
  );
};

export default Visualizer;
