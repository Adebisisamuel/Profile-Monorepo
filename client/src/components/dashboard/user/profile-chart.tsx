import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { RoleScore } from "@shared/schema";
import { ROLE_COLORS, ROLE_LABELS, ROLES } from "@shared/constants";

interface ProfileChartProps {
  scores: RoleScore;
}

// TypeScript type for role data mapping
interface RoleDataItem {
  key: string;
  label: string;
  score: number;
  percentage: number;
  color: string;
}

export function ProfileChart({ scores }: ProfileChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart<"bar", number[], string> | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Define the mapping from role constants to database field names
    const roleToField: Record<string, string> = {
      [ROLES.APOSTLE]: "apostle",
      [ROLES.PROPHET]: "prophet",
      [ROLES.EVANGELIST]: "evangelist",
      [ROLES.HERDER]: "herder",
      [ROLES.TEACHER]: "teacher"
    };
    
    // We want to show roles in this specific order
    const roleKeys = [ROLES.APOSTLE, ROLES.PROPHET, ROLES.EVANGELIST, ROLES.HERDER, ROLES.TEACHER];
    
    // Get the labels for each role
    const roleLabels = roleKeys.map(key => ROLE_LABELS[key]);
    
    // Get values for each role from the scores object
    const roleValues = roleKeys.map(key => {
      const fieldName = roleToField[key];
      const value = scores[fieldName as keyof RoleScore];
      return typeof value === 'number' ? value : 0;
    });
    
    // Create sorted indices to identify primary and secondary roles
    const sortedIndices = roleValues.map((_, i) => i)
      .sort((a, b) => roleValues[b] - roleValues[a]);
    
    // Get primary and secondary indices
    const primaryIndex = sortedIndices[0];
    const secondaryIndex = sortedIndices[1];
    
    // Create colors array with solid colors (no gradients)
    const roleColors = roleKeys.map((key, index) => {
      // Highlight primary and secondary roles with solid colors
      if (index === primaryIndex) {
        return ROLE_COLORS[key].replace(/rgba\((.+?), [0-9.]+\)/, 'rgba($1, 1.0)'); // Full opacity for primary
      } else if (index === secondaryIndex) {
        return ROLE_COLORS[key].replace(/rgba\((.+?), [0-9.]+\)/, 'rgba($1, 0.8)'); // 80% opacity for secondary
      } else {
        return ROLE_COLORS[key].replace(/rgba\((.+?), [0-9.]+\)/, 'rgba($1, 0.4)'); // 40% opacity for others
      }
    });
    
    // Calculate the maximum score for proper axis scaling
    const maxScore = Math.max(...roleValues, 70); // Default to at least 70 for scale
    
    try {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: roleLabels,
          datasets: [{
            label: 'Jouw Score',
            data: roleValues,
            backgroundColor: roleColors,
            borderWidth: 0,
            borderRadius: 4,
            barThickness: 20,
            maxBarThickness: 30
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw as number;
                  const maxPossible = 70; // Maximum possible score
                  const percentage = Math.round((value / maxPossible) * 100);
                  return `Score: ${value} (${percentage}%)`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: maxScore,
              grid: {
                display: false
              },
              ticks: {
                callback: function(value) {
                  const percentage = Math.round((Number(value) / 70) * 100);
                  return `${value} (${percentage}%)`;
                },
                stepSize: 10
              }
            },
            y: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    } catch (err) {
      console.error("Error creating chart:", err);
    }
    
    // Clean up function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [scores]);

  // Calculate role data for displaying in the DOM when chart fails
  // Use proper typing to avoid TypeScript errors
  const roleToField: Record<string, string> = {
    [ROLES.APOSTLE]: "apostle",
    [ROLES.PROPHET]: "prophet",
    [ROLES.EVANGELIST]: "evangelist",
    [ROLES.HERDER]: "herder",
    [ROLES.TEACHER]: "teacher"
  };
  
  const roleKeys = [ROLES.APOSTLE, ROLES.PROPHET, ROLES.EVANGELIST, ROLES.HERDER, ROLES.TEACHER];
  
  const roleData: RoleDataItem[] = roleKeys.map(key => {
    const fieldName = roleToField[key];
    // Explicitly type the score to avoid unknown type errors
    const scoreValue = scores[fieldName as keyof RoleScore];
    const score = typeof scoreValue === 'number' ? scoreValue : 0;
    const percentage = Math.round((score / 70) * 100);
    
    return {
      key,
      label: ROLE_LABELS[key],
      score,
      percentage,
      color: ROLE_COLORS[key]
    };
  });
  
  // Sort by score for fallback display
  const sortedRoleData = [...roleData].sort((a, b) => b.score - a.score);
  
  return (
    <div className="mb-8 w-full" style={{ height: "300px" }}>
      <canvas ref={chartRef} style={{ width: "100%", height: "100%" }}></canvas>
    </div>
  );
}
