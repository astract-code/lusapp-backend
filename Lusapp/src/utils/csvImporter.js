import Papa from 'papaparse';

export const parseCSV = (csvText) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const races = results.data.map((row, index) => ({
          id: `imported-race-${Date.now()}-${index}`,
          name: row.name || row.eventName || row['Event Name'] || 'Unnamed Race',
          sport: (row.sport || row.sportType || row['Sport Type'] || 'triathlon').toLowerCase(),
          city: row.city || row.location || '',
          country: row.country || '',
          continent: row.continent || '',
          date: row.date || '',
          distance: row.distance || '',
          description: row.description || '',
          participants: parseInt(row.participants) || 0,
          registeredUsers: [],
        }));
        resolve(races);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const fetchCSVFromURL = async (url) => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return await parseCSV(text);
  } catch (error) {
    throw new Error(`Failed to fetch CSV from URL: ${error.message}`);
  }
};
