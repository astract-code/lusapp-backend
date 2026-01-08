const fs = require('fs');

const INPUT_FILE = 'attached_assets/2026_01_(1)_1767837875752.csv';
const OUTPUT_FILE = 'attached_assets/corrected_2026_races.csv';

const VALID_SUBTYPES = {
    'Running': ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra Marathon', 'Trail Running', 'Cross Country', 'Custom Distance'],
    'Triathlon': ['Sprint', 'Olympic', 'Half Ironman', 'Ironman', 'Aquathlon', 'Duathlon', 'Custom Distance'],
    'Cycling': ['Criterium', 'Gran Fondo', 'Mountain Biking', 'Road Race', 'Custom Distance'],
    'Fitness': ['Spartan Race', 'HYROX', 'Obstacle Course', 'CrossFit', 'Bootcamp', 'Custom Distance'],
    'Swimming': ['Open Water Swim', 'Pool Competition', 'Custom Distance'],
    'Custom': ['Custom Event']
};

function parseCSV(content) {
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('```'));
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (const char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((h, idx) => row[h] = values[idx] || '');
            rows.push(row);
        }
    }
    return { headers, rows };
}

function fixRow(row) {
    let sport = (row.sport || '').trim();
    let sportCategory = (row.sport_category || '').trim();
    let sportSubtype = (row.sport_subtype || '').trim();
    const name = (row.name || '').toLowerCase();
    
    if (sport === 'Spartan') {
        sport = 'Fitness';
        sportSubtype = 'Spartan Race';
    }
    else if (sport === 'Hyrox') {
        sport = 'Fitness';
        sportSubtype = 'HYROX';
    }
    else if (sport === 'Running') {
        if (sportSubtype === 'Ultra') {
            sportSubtype = 'Ultra Marathon';
        } else if (sportSubtype === 'Trail') {
            sportSubtype = 'Trail Running';
        } else if (sportSubtype === 'Ultra Trail') {
            sportSubtype = 'Ultra Marathon';
        } else if (['20K', '6.7K'].includes(sportSubtype)) {
            sportSubtype = 'Custom Distance';
        } else if (!sportSubtype) {
            if (sportCategory.includes('Trail')) {
                sportSubtype = 'Trail Running';
            } else if (sportCategory.includes('Road')) {
                if (name.includes('marathon') && !name.includes('half')) {
                    sportSubtype = 'Marathon';
                } else if (name.includes('half marathon') || name.includes('half-marathon')) {
                    sportSubtype = 'Half Marathon';
                } else if (name.includes('10k') || name.includes('10 k')) {
                    sportSubtype = '10K';
                } else if (name.includes('5k') || name.includes('5 k')) {
                    sportSubtype = '5K';
                } else {
                    sportSubtype = 'Custom Distance';
                }
            } else {
                sportSubtype = 'Custom Distance';
            }
        }
    }
    else if (sport === 'Triathlon') {
        if (!sportSubtype || sportSubtype === 'Open') {
            if (sportCategory.includes('Olympic')) {
                sportSubtype = 'Olympic';
            } else if (sportCategory.includes('Half Ironman') || sportCategory.includes('70.3')) {
                sportSubtype = 'Half Ironman';
            } else if (sportCategory.includes('Full Ironman') || (sportCategory.includes('Ironman') && !sportCategory.includes('Half'))) {
                sportSubtype = 'Ironman';
            } else if (sportCategory.includes('Sprint')) {
                sportSubtype = 'Sprint';
            } else {
                sportSubtype = 'Olympic';
            }
        }
    }
    
    const validForSport = VALID_SUBTYPES[sport] || [];
    if (!validForSport.includes(sportSubtype)) {
        sportSubtype = 'Custom Distance';
    }
    
    row.sport = sport;
    row.sport_category = '';
    row.sport_subtype = sportSubtype;
    
    return row;
}

function toCSV(headers, rows) {
    const lines = [headers.join(',')];
    for (const row of rows) {
        const values = headers.map(h => {
            let val = row[h] || '';
            if (val.includes(',') || val.includes('"')) {
                val = '"' + val.replace(/"/g, '""') + '"';
            }
            return val;
        });
        lines.push(values.join(','));
    }
    return lines.join('\n');
}

function main() {
    let content = fs.readFileSync(INPUT_FILE, 'utf-8');
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    
    const { headers, rows } = parseCSV(content);
    console.log(`Loaded ${rows.length} rows`);
    
    let fixedCount = 0;
    const fixedRows = rows.map(row => {
        const original = JSON.stringify(row);
        const fixed = fixRow({ ...row });
        if (JSON.stringify(fixed) !== original) fixedCount++;
        return fixed;
    });
    
    const output = toCSV(headers, fixedRows);
    fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
    
    console.log(`Fixed ${fixedCount} rows with taxonomy issues`);
    console.log(`Output saved to: ${OUTPUT_FILE}`);
    
    const sportCounts = {};
    const subtypeCounts = {};
    fixedRows.forEach(row => {
        sportCounts[row.sport] = (sportCounts[row.sport] || 0) + 1;
        subtypeCounts[row.sport_subtype] = (subtypeCounts[row.sport_subtype] || 0) + 1;
    });
    
    console.log('\n--- Sport Distribution ---');
    Object.entries(sportCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([sport, count]) => console.log(`  ${sport}: ${count}`));
    
    console.log('\n--- Subtype Distribution ---');
    Object.entries(subtypeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([subtype, count]) => console.log(`  ${subtype}: ${count}`));
}

main();
