import { useEffect, useRef } from 'react';
import { ROLES, ROLE_COLORS } from '@/lib/constants';

interface RoleScores {
  apostle: number;
  prophet: number;
  evangelist: number;
  shepherd: number;
  teacher: number;
}

interface RadarChartProps {
  data: RoleScores;
  max?: number;
  showLegend?: boolean;
}

export function RadarChart({ data, max = 30, showLegend = false }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create the radar chart
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Chart dimensions
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    // Calculate positions for each axis
    const numberOfAxes = 5; // apostle, prophet, evangelist, shepherd, teacher
    const axisPositions = [];
    for (let i = 0; i < numberOfAxes; i++) {
      const angle = (Math.PI * 2 * i) / numberOfAxes - Math.PI / 2;
      axisPositions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        angle
      });
    }
    
    // Draw the radar grid
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.fillStyle = 'rgba(100, 100, 100, 0.05)';
    
    // Draw concentric circles (levels)
    const numLevels = 5;
    for (let level = 1; level <= numLevels; level++) {
      const levelRadius = (radius * level) / numLevels;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, levelRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw level text (only on vertical axis)
      if (level < numLevels) {
        const levelValue = Math.round((max * level) / numLevels);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(levelValue.toString(), centerX, centerY - levelRadius - 5);
      }
    }
    
    // Draw axes
    for (let i = 0; i < numberOfAxes; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(axisPositions[i].x, axisPositions[i].y);
      ctx.stroke();
      
      // Draw axis labels
      const roleKey = Object.keys(ROLES)[i] as keyof typeof ROLES;
      const label = ROLES[roleKey];
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Position labels outside the chart
      const labelRadius = radius * 1.1;
      const angle = axisPositions[i].angle;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);
      
      ctx.fillText(label, labelX, labelY);
    }
    
    // Convert data values to coordinates
    const dataPoints = [];
    const values = [
      data.apostle || 0, 
      data.prophet || 0, 
      data.evangelist || 0, 
      data.shepherd || 0, 
      data.teacher || 0
    ];
    
    for (let i = 0; i < numberOfAxes; i++) {
      const value = Math.min(values[i], max); // Cap at max
      const normalizedValue = value / max;
      const angle = axisPositions[i].angle;
      const pointRadius = radius * normalizedValue;
      
      dataPoints.push({
        x: centerX + pointRadius * Math.cos(angle),
        y: centerY + pointRadius * Math.sin(angle),
        value
      });
    }
    
    // Draw the data shape
    ctx.beginPath();
    ctx.moveTo(dataPoints[0].x, dataPoints[0].y);
    for (let i = 1; i < dataPoints.length; i++) {
      ctx.lineTo(dataPoints[i].x, dataPoints[i].y);
    }
    ctx.lineTo(dataPoints[0].x, dataPoints[0].y);
    ctx.closePath();
    
    // Fill the shape with a semi-transparent color
    ctx.fillStyle = 'rgba(54, 162, 235, 0.2)';
    ctx.fill();
    
    // Draw the outline
    ctx.strokeStyle = 'rgba(54, 162, 235, 1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw data points
    const roleKeys = Object.keys(ROLES) as Array<keyof typeof ROLES>;
    for (let i = 0; i < dataPoints.length; i++) {
      const { x, y, value } = dataPoints[i];
      
      // Draw colored point
      const roleKey = roleKeys[i] as keyof typeof ROLE_COLORS;
      const color = ROLE_COLORS[roleKey] || 'rgba(54, 162, 235, 1)';
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw value
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Position value next to the point
      const labelAngle = axisPositions[i].angle;
      const labelDistance = 15;
      const labelX = x + labelDistance * Math.cos(labelAngle);
      const labelY = y + labelDistance * Math.sin(labelAngle);
      
      ctx.fillText(value.toString(), labelX, labelY);
    }
    
    // Draw legend if needed
    if (showLegend) {
      const legendX = 10;
      let legendY = height - 70;
      const legendSpacing = 20;
      
      for (let i = 0; i < roleKeys.length; i++) {
        const roleKey = roleKeys[i] as keyof typeof ROLE_COLORS;
        const color = ROLE_COLORS[roleKey] || 'rgba(54, 162, 235, 1)';
        const label = ROLES[roleKey];
        
        // Draw colored square
        ctx.fillStyle = color;
        ctx.fillRect(legendX, legendY, 15, 15);
        
        // Draw label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, legendX + 20, legendY + 7.5);
        
        legendY += legendSpacing;
      }
    }
    
  }, [data, max, showLegend]);

  return (
    <div className="flex justify-center items-center w-full">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        className="max-w-full"
      />
    </div>
  );
}