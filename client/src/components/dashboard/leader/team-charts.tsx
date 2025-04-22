import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { ROLE_COLORS, ROLES, ROLE_LABELS } from "@shared/constants";

// Type definitions for better TypeScript support
interface TeamResult {
  userId: number;
  scores: Record<string, number>;
}

interface AggregatedScores {
  [key: string]: number;
}

interface TeamChartsProps {
  teamResults: TeamResult[];
}

export function TeamCharts({ teamResults }: TeamChartsProps) {
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartInstance = useRef<Chart<"bar", number[], string> | null>(null);
  const pieChartInstance = useRef<Chart<"doughnut", number[], string> | null>(null);

  useEffect(() => {
    if (!teamResults.length || !barChartRef.current || !pieChartRef.current) return;
    
    // Destroy previous chart instances if they exist
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }
    
    const barCtx = barChartRef.current.getContext('2d');
    const pieCtx = pieChartRef.current.getContext('2d');
    
    if (!barCtx || !pieCtx) return;
    
    // Aggregate scores across all team members using the shared constants structure
    const aggregatedScores: AggregatedScores = {
      [ROLES.APOSTLE]: 0,
      [ROLES.PROPHET]: 0,
      [ROLES.EVANGELIST]: 0,
      [ROLES.HERDER]: 0,
      [ROLES.TEACHER]: 0
    };
    
    // Mapping from database field names to roles constants
    const fieldToRole: Record<string, string> = {
      'apostle': ROLES.APOSTLE,
      'prophet': ROLES.PROPHET,
      'evangelist': ROLES.EVANGELIST,
      'herder': ROLES.HERDER,
      'teacher': ROLES.TEACHER
    };
    
    teamResults.forEach(result => {
      if (result.scores) {
        // Map database field names to our role constants
        Object.entries(result.scores).forEach(([field, score]) => {
          const roleKey = fieldToRole[field as keyof typeof fieldToRole];
          if (roleKey) {
            aggregatedScores[roleKey] += score;
          }
        });
      }
    });
    
    // Get role keys in a specific order
    const roleKeys = [ROLES.APOSTLE, ROLES.PROPHET, ROLES.EVANGELIST, ROLES.HERDER, ROLES.TEACHER];
    
    // Generate data for charts
    const roleLabels = roleKeys.map(key => ROLE_LABELS[key]);
    const roleValues = roleKeys.map(key => aggregatedScores[key]);
    const roleColors = roleKeys.map(key => ROLE_COLORS[key]);
    
    // Calculate percentages for pie chart
    const totalScores = Object.values(aggregatedScores).reduce((sum, score) => sum + score, 0);
    // Use the same roleKeys array to calculate percentages, ensuring consistency
    const percentages = roleKeys.map(key => {
      const value = aggregatedScores[key];
      return Math.round((value / totalScores) * 100);
    });
    
    // Create bar chart
    barChartInstance.current = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: roleLabels,
        datasets: [{
          label: 'Totale Score',
          data: roleValues,
          backgroundColor: roleColors,
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#EDF2F7'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
    
    // Create pie chart
    pieChartInstance.current = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: roleLabels,
        datasets: [{
          data: percentages,
          backgroundColor: roleColors,
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
    
    // Clean up function
    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
    };
  }, [teamResults]);

  if (!teamResults.length) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg text-navy mb-6">De totale score van het team per rol</h3>
          <div className="h-[250px] flex items-center justify-center text-navy-light">
            Geen resultaten beschikbaar
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg text-navy mb-6">Verdeling in percentages</h3>
          <div className="h-[250px] flex items-center justify-center text-navy-light">
            Geen resultaten beschikbaar
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-lg text-navy mb-6">De totale score van het team per rol</h3>
        <div>
          <canvas ref={barChartRef} height="250"></canvas>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-lg text-navy mb-6">Verdeling in percentages</h3>
        <div>
          <canvas ref={pieChartRef} height="250"></canvas>
        </div>
      </div>
    </div>
  );
}
