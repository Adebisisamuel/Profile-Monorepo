interface ExportOptions {
  fileName?: string;
  fileType?: 'json' | 'csv';
}

/**
 * Helper function to export data as a file
 */
export const exportDataAsFile = (data: any, options: ExportOptions = {}) => {
  const { fileName = 'export', fileType = 'json' } = options;
  
  let content: string;
  let mimeType: string;
  let extension: string;
  
  if (fileType === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
    extension = 'json';
  } else if (fileType === 'csv') {
    // Simple CSV export for flat data
    if (Array.isArray(data)) {
      // Array of objects
      if (data.length === 0) {
        content = '';
      } else {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(item => 
          Object.values(item)
            .map(value => {
              if (typeof value === 'string') {
                // Escape quotes and wrap in quotes if needed
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              }
              return String(value);
            })
            .join(',')
        );
        content = [headers, ...rows].join('\n');
      }
    } else {
      // Single object
      const headers = Object.keys(data).join(',');
      const values = Object.values(data)
        .map(value => {
          if (typeof value === 'string') {
            // Escape quotes and wrap in quotes if needed
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }
          return String(value);
        })
        .join(',');
      content = [headers, values].join('\n');
    }
    mimeType = 'text/csv';
    extension = 'csv';
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
  
  // Create a Blob with the data
  const blob = new Blob([content], { type: mimeType });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.${extension}`;
  
  // Trigger the download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export user profile data
 */
export const exportUserProfile = async (userId: number) => {
  try {
    const response = await fetch(`/api/users/${userId}/export`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export profile: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Generate a meaningful filename
    const fileName = `profile_${data.user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    
    exportDataAsFile(data, { fileName });
    
    return true;
  } catch (error) {
    console.error('Error exporting profile:', error);
    return false;
  }
};

/**
 * Export team data
 */
export const exportTeamData = async (teamId: number, teamName: string) => {
  try {
    const response = await fetch(`/api/teams/${teamId}/export`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export team data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Generate a meaningful filename
    const fileName = `team_${teamName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    
    exportDataAsFile(data, { fileName });
    
    return true;
  } catch (error) {
    console.error('Error exporting team data:', error);
    return false;
  }
};