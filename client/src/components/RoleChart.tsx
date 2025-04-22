import { ROLES, ROLE_COLORS, ROLE_LABELS } from "@shared/constants";
import { RoleResults } from "@shared/types";
import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface RoleChartProps {
  results: RoleResults;
  type: "bar" | "pie" | "radar";
  height?: number;
  width?: number;
  showLegend?: boolean;
  isTeam?: boolean;
  comparisonData?: RoleResults;
}

export default function RoleChart({ 
  results, 
  type, 
  height = 350,
  width = 300,
  showLegend = false,
  isTeam = false,
  comparisonData
}: RoleChartProps) {
  // Debug logging for chart props
  console.log(`RoleChart rendering with type: ${type}`, {
    results,
    hasResults: !!results,
    resultsIsObject: typeof results === 'object',
    resultsKeys: results ? Object.keys(results) : [],
    comparisonData
  });
  
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Use these specific roles in this exact order for consistency
    const roleKeys = [ROLES.APOSTLE, ROLES.PROPHET, ROLES.EVANGELIST, ROLES.HERDER, ROLES.TEACHER];
    const labels = roleKeys.map(role => ROLE_LABELS[role]);
    
    // Get data in the same order as our keys
    const data = roleKeys.map(role => {
      // Convert to number and handle undefined/null values
      return typeof results[role] === 'number' ? results[role] : 0;
    });
    
    // Get comparison data if provided
    const comparisonValues = comparisonData 
      ? roleKeys.map(role => {
          return typeof comparisonData[role] === 'number' ? comparisonData[role] : 0;
        }) 
      : [];
    
    // Create sorted indices to identify primary and secondary roles
    const dataWithIndices = data.map((value, index) => ({ value, index }));
    const sortedData = [...dataWithIndices].sort((a, b) => b.value - a.value);
    const primaryIndex = sortedData[0].index;
    const secondaryIndex = sortedData[1].index;
    
    // Get colors for each role with different opacity based on primary/secondary status
    const backgroundColors = roleKeys.map((role, index) => {
      const baseColor = ROLE_COLORS[role]; // Use the color from constants
      
      // For bar charts, make primary and secondary roles more prominent
      if (type === 'bar') {
        if (index === primaryIndex) {
          return baseColor.replace(/rgba\((.+?), [0-9.]+\)/, 'rgba($1, 1.0)'); // Full opacity for primary
        } else if (index === secondaryIndex) {
          return baseColor.replace(/rgba\((.+?), [0-9.]+\)/, 'rgba($1, 0.8)'); // 80% opacity for secondary
        } else {
          return baseColor.replace(/rgba\((.+?), [0-9.]+\)/, 'rgba($1, 0.4)'); // 40% opacity for others
        }
      }
      
      return baseColor; // Default return for other chart types
    });
    
    // Calculate total for percentage display in tooltips
    const total = data.reduce((sum, val) => sum + val, 0);
    
    if (type === 'bar') {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: isTeam ? 'Team Score' : 'Jouw Score',
              data,
              backgroundColor: backgroundColors,
              borderWidth: 0,
              borderRadius: 4
            },
            ...(comparisonData ? [{
              label: 'Vergelijking',
              data: comparisonValues,
              backgroundColor: 'rgba(180, 180, 180, 0.5)',
              borderWidth: 0,
              borderRadius: 4
            }] : [])
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              right: 30 // Add padding on the right for the legend
            }
          },
          plugins: {
            legend: {
              display: showLegend,
              position: 'right',
              align: 'start',
              labels: {
                usePointStyle: true,
                padding: 8,
                boxWidth: 8,
                boxHeight: 8,
                font: {
                  size: 11
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(tooltipItem) {
                  const value = tooltipItem.raw as number;
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${tooltipItem.label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: false
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
    } else if (type === 'pie') {
      // CRITICAL FIX: Filter out zero values to prevent 1% slices
      // Completely remove zero or very small values from pie chart
      const epsilon = 0.001; // Use a very small threshold instead of exactly 0
      const nonZeroIndices = data.map((value, index) => ({value, index})).filter(item => item.value > epsilon);
      const filteredLabels = nonZeroIndices.map(item => labels[item.index]);
      const filteredData = nonZeroIndices.map(item => item.value);
      const filteredColors = nonZeroIndices.map(item => backgroundColors[item.index]);
      
      // Calculate a new total for percentages based only on included data
      const filteredTotal = filteredData.reduce((sum, value) => sum + value, 0);
      
      console.log('Pie chart filtered data:', {
        originalData: data,
        originalLabels: labels,
        filteredData,
        filteredLabels,
        filteredTotal,
        nonZeroIndices: nonZeroIndices.map(i => i.index)
      });
      
      // If all values are zero/insignificant, display an empty chart with a message
      if (filteredData.length === 0) {
        chartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Geen data'],
            datasets: [{
              data: [1],
              backgroundColor: ['#e5e7eb'], // Gray color
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false }
            }
          }
        });
      } else {
        chartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: filteredLabels,
            datasets: [{
              data: filteredData,
              backgroundColor: filteredColors,
              borderWidth: 1,
              borderColor: '#fff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                right: 50 // Add padding on the right for the legend
              }
            },
            plugins: {
              legend: {
                display: showLegend,
                position: 'right',
                align: 'start',
                labels: {
                  usePointStyle: true,
                  padding: 12,
                  boxWidth: 10,
                  boxHeight: 10,
                  font: {
                    size: 9
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(tooltipItem) {
                    const value = tooltipItem.raw as number;
                    // Calculate percentage based on filtered data total
                    const percentage = filteredTotal > 0 ? Math.round((value / filteredTotal) * 100) : 0;
                    return `${tooltipItem.label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    } else if (type === 'radar') {
      chartInstance.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels,
          datasets: [
            {
              label: isTeam ? 'Team Profiel' : 'Jouw Profiel',
              data,
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              borderColor: 'rgba(99, 102, 241, 0.8)',
              borderWidth: 2,
              pointBackgroundColor: backgroundColors,
              pointRadius: 4
            },
            ...(comparisonData ? [{
              label: 'Vergelijking',
              data: comparisonValues,
              backgroundColor: 'rgba(180, 180, 180, 0.2)',
              borderColor: 'rgba(180, 180, 180, 0.8)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(180, 180, 180, 1)',
              pointRadius: 3
            }] : [])
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              right: 50 // Add padding on the right for the legend
            }
          },
          plugins: {
            legend: {
              display: showLegend,
              position: 'right',
              align: 'start',
              labels: {
                usePointStyle: true,
                padding: 12,
                boxWidth: 10,
                boxHeight: 10,
                font: {
                  size: 9
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(tooltipItem) {
                  const value = tooltipItem.raw as number;
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${tooltipItem.label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          scales: {
            r: {
              beginAtZero: true,
              ticks: {
                display: false
              },
              pointLabels: {
                font: {
                  size: 10
                }
              }
            }
          }
        }
      });
    }
    
    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [results, type, height, width, showLegend, isTeam, comparisonData]);
  
  return (
    <div style={{ height, width: width || '100%' }} className="flex flex-col">
      <canvas ref={chartRef} style={{ height: '100%', width: '100%' }}></canvas>
    </div>
  );
}