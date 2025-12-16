
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(fieldName => {
        // Handle strings with commas or newlines
        let value = row[fieldName];
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        resolve([]);
        return;
      }

      const lines = text.split('\n');
      if (lines.length < 2) {
        resolve([]);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const result = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Basic CSV splitting (does not handle commas inside quotes perfectly for simplicity)
        // For production, use a library like PapaParse
        const currentLine = lines[i].split(',');
        const obj: any = {};

        headers.forEach((header, index) => {
          let val = currentLine[index]?.trim();
          // Try to convert numbers
          if (val && !isNaN(Number(val))) {
            obj[header] = Number(val);
          } else {
            obj[header] = val?.replace(/^"|"$/g, '');
          }
        });
        
        result.push(obj);
      }
      resolve(result);
    };

    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};
