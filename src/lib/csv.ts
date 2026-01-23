
export function exportToCsv(filename: string, data: any[]) {
  if (data.length === 0) {
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      let value = row[header];
      if (typeof value === 'string') {
        // Escape quotes
        value = value.replace(/"/g, '""');
        // Enclose in quotes if it contains a comma
        if (value.includes(',')) {
          value = `"${value}"`;
        }
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
