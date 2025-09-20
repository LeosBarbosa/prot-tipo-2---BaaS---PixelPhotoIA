/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';
import { createCurveLUT } from '../utils/imageProcessing';

interface ToneCurveProps {
  histogram: { r: number[], g: number[], b: number[] } | null;
  onCurveChange: (lut: number[]) => void;
  onReset: () => void;
  disabled: boolean;
}

const CANVAS_SIZE = 256;
const PADDING = 10;
const GRAPH_SIZE = CANVAS_SIZE - PADDING * 2;
const POINT_RADIUS = 6;

const ToneCurve: React.FC<ToneCurveProps> = ({ histogram, onCurveChange, onReset, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [controlPoints, setControlPoints] = useState([{ x: 0.25, y: 0.75 }, { x: 0.75, y: 0.25 }]);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number, y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(PADDING, Math.min(e.clientX - rect.left, CANVAS_SIZE - PADDING));
    const y = Math.max(PADDING, Math.min(e.clientY - rect.top, CANVAS_SIZE - PADDING));
    return { x, y };
  };
  
  const handleReset = () => {
    setControlPoints([{ x: 0.25, y: 0.75 }, { x: 0.75, y: 0.25 }]);
    onReset();
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const { x, y } = getCanvasCoords(e);
    
    for (let i = 0; i < controlPoints.length; i++) {
        const point = controlPoints[i];
        const pointX = PADDING + point.x * GRAPH_SIZE;
        const pointY = PADDING + point.y * GRAPH_SIZE;
        const distance = Math.sqrt(Math.pow(pointX - x, 2) + Math.pow(pointY - y, 2));
        if (distance < POINT_RADIUS * 2) {
            setDraggingPointIndex(i);
            return;
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingPointIndex === null || disabled) return;
    const { x, y } = getCanvasCoords(e);
    const newPoints = [...controlPoints];
    newPoints[draggingPointIndex] = {
        x: (x - PADDING) / GRAPH_SIZE,
        y: (y - PADDING) / GRAPH_SIZE,
    };
    setControlPoints(newPoints);
  };

  const handleMouseUp = () => {
    setDraggingPointIndex(null);
  };
  
  // Recalculate LUT when points change
  useEffect(() => {
    const lut = createCurveLUT(controlPoints);
    onCurveChange(lut);
  }, [controlPoints, onCurveChange]);

  // Drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        const pos = PADDING + (GRAPH_SIZE / 4) * i;
        ctx.beginPath();
        ctx.moveTo(pos, PADDING);
        ctx.lineTo(pos, CANVAS_SIZE - PADDING);
        ctx.moveTo(PADDING, pos);
        ctx.lineTo(CANVAS_SIZE - PADDING, pos);
        ctx.stroke();
    }
    
    // Draw histogram
    if (histogram) {
      const allChannels = new Array(256).fill(0);
      for(let i = 0; i < 256; i++) {
        allChannels[i] = (histogram.r[i] + histogram.g[i] + histogram.b[i]) / 3;
      }
      const maxVal = Math.max(...allChannels);
      
      // Use a logarithmic scale for better visualization of darker/lighter tones
      const logMax = Math.log10(maxVal > 1 ? maxVal : 1);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(PADDING, CANVAS_SIZE - PADDING);
      allChannels.forEach((val, i) => {
        const x = PADDING + (i / 255) * GRAPH_SIZE;
        const logVal = Math.log10(val > 1 ? val : 1);
        const height = logMax > 0 ? (logVal / logMax) * GRAPH_SIZE : 0;
        const y = CANVAS_SIZE - PADDING - height;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(CANVAS_SIZE - PADDING, CANVAS_SIZE - PADDING);
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw curve
    const p0 = { x: PADDING, y: CANVAS_SIZE - PADDING };
    const p3 = { x: CANVAS_SIZE - PADDING, y: PADDING };
    const p1 = { x: PADDING + controlPoints[0].x * GRAPH_SIZE, y: PADDING + controlPoints[0].y * GRAPH_SIZE };
    const p2 = { x: PADDING + controlPoints[1].x * GRAPH_SIZE, y: PADDING + controlPoints[1].y * GRAPH_SIZE };
    
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    ctx.stroke();

    // Draw points
    [p1, p2].forEach(p => {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, POINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });

  }, [histogram, controlPoints]);

  return (
    <div className="flex flex-col items-center gap-4">
        <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className={`bg-gray-900/50 border border-gray-700 rounded-lg ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
        <button
            onClick={handleReset}
            disabled={disabled}
            className="w-full max-w-[256px] bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
            Resetar Curva
        </button>
    </div>
  );
};

export default ToneCurve;