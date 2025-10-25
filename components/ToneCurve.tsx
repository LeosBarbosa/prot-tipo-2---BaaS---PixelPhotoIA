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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        const { r, g, b } = histogram;
        const maxVal = Math.max(...r, ...g, ...b);
        for (let i = 0; i < 256; i++) {
            const x = PADDING + (i / 255) * GRAPH_SIZE;
            const height = ((r[i] + g[i] + b[i]) / 3 / maxVal) * GRAPH_SIZE;
            ctx.fillRect(x, CANVAS_SIZE - PADDING - height, 1, height);
        }
    }

    // Draw curve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PADDING, CANVAS_SIZE - PADDING);
    const p0 = { x: 0, y: 1 };
    const p3 = { x: 1, y: 0 };
    ctx.bezierCurveTo(
        PADDING + controlPoints[0].x * GRAPH_SIZE,
        PADDING + controlPoints[0].y * GRAPH_SIZE,
        PADDING + controlPoints[1].x * GRAPH_SIZE,
        PADDING + controlPoints[1].y * GRAPH_SIZE,
        PADDING + p3.x * GRAPH_SIZE,
        PADDING + p3.y * GRAPH_SIZE
    );
    ctx.stroke();

    // Draw control points
    controlPoints.forEach((p, i) => {
        const x = PADDING + p.x * GRAPH_SIZE;
        const y = PADDING + p.y * GRAPH_SIZE;
        ctx.beginPath();
        ctx.fillStyle = draggingPointIndex === i ? '#3B82F6' : '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    });

  }, [histogram, controlPoints, draggingPointIndex]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className={`bg-gray-900/50 rounded-md border border-gray-700 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <button onClick={handleReset} disabled={disabled} className="text-xs text-gray-400 hover:text-white disabled:opacity-50">Redefinir Curva</button>
    </div>
  );
};

export default ToneCurve;
