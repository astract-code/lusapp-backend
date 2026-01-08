import csv
import sys

INPUT_FILE = 'attached_assets/2026_01_(1)_1767837875752.csv'
OUTPUT_FILE = 'attached_assets/corrected_2026_races.csv'

VALID_SPORTS = ['Running', 'Triathlon', 'Cycling', 'Fitness', 'Swimming', 'Custom']

VALID_SUBTYPES = {
    'Running': ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra Marathon', 'Trail Running', 'Cross Country', 'Custom Distance'],
    'Triathlon': ['Sprint', 'Olympic', 'Half Ironman', 'Ironman', 'Aquathlon', 'Duathlon', 'Custom Distance'],
    'Cycling': ['Criterium', 'Gran Fondo', 'Mountain Biking', 'Road Race', 'Custom Distance'],
    'Fitness': ['Spartan Race', 'HYROX', 'Obstacle Course', 'CrossFit', 'Bootcamp', 'Custom Distance'],
    'Swimming': ['Open Water Swim', 'Pool Competition', 'Custom Distance'],
    'Custom': ['Custom Event']
}

def fix_row(row):
    sport = row.get('sport', '').strip()
    sport_category = row.get('sport_category', '').strip()
    sport_subtype = row.get('sport_subtype', '').strip()
    
    fixed_sport = sport
    fixed_subtype = sport_subtype
    
    if sport == 'Spartan':
        fixed_sport = 'Fitness'
        if sport_subtype in ['Super', 'Beast', 'Open', 'Sprint', 'Trifecta', '']:
            fixed_subtype = 'Spartan Race'
    
    elif sport == 'Hyrox':
        fixed_sport = 'Fitness'
        if sport_subtype in ['Pro', '']:
            fixed_subtype = 'HYROX'
    
    elif sport == 'Running':
        if sport_subtype == 'Ultra':
            fixed_subtype = 'Ultra Marathon'
        elif sport_subtype == 'Trail':
            fixed_subtype = 'Trail Running'
        elif sport_subtype == 'Ultra Trail':
            fixed_subtype = 'Ultra Marathon'
        elif sport_subtype in ['20K', '6.7K']:
            fixed_subtype = 'Custom Distance'
        elif sport_subtype == '':
            if 'Trail' in sport_category:
                fixed_subtype = 'Trail Running'
            elif 'Road' in sport_category:
                if 'marathon' in row.get('name', '').lower():
                    fixed_subtype = 'Marathon'
                elif 'half' in row.get('name', '').lower():
                    fixed_subtype = 'Half Marathon'
                elif '10k' in row.get('name', '').lower() or '10 k' in row.get('name', '').lower():
                    fixed_subtype = '10K'
                elif '5k' in row.get('name', '').lower() or '5 k' in row.get('name', '').lower():
                    fixed_subtype = '5K'
                else:
                    fixed_subtype = 'Custom Distance'
            else:
                fixed_subtype = 'Custom Distance'
    
    elif sport == 'Triathlon':
        if sport_subtype == '':
            if 'Olympic' in sport_category:
                fixed_subtype = 'Olympic'
            elif 'Half Ironman' in sport_category or '70.3' in sport_category:
                fixed_subtype = 'Half Ironman'
            elif 'Full Ironman' in sport_category or 'Ironman' in sport_category:
                fixed_subtype = 'Ironman'
            elif 'Sprint' in sport_category:
                fixed_subtype = 'Sprint'
            else:
                fixed_subtype = 'Olympic'
        elif sport_subtype == 'Open':
            fixed_subtype = 'Olympic'
    
    if fixed_subtype not in VALID_SUBTYPES.get(fixed_sport, []):
        if fixed_sport in VALID_SUBTYPES:
            fixed_subtype = 'Custom Distance'
    
    row['sport'] = fixed_sport
    row['sport_category'] = ''
    row['sport_subtype'] = fixed_subtype
    
    return row

def main():
    rows_processed = 0
    rows_fixed = 0
    
    with open(INPUT_FILE, 'r', encoding='utf-8-sig') as infile:
        content = infile.read()
        if content.startswith('```'):
            lines = content.split('\n')
            lines = [l for l in lines if not l.startswith('```')]
            content = '\n'.join(lines)
        
        reader = csv.DictReader(content.splitlines())
        fieldnames = reader.fieldnames
        
        fixed_rows = []
        for row in reader:
            original = dict(row)
            fixed = fix_row(row)
            if original != fixed:
                rows_fixed += 1
            fixed_rows.append(fixed)
            rows_processed += 1
    
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(fixed_rows)
    
    print(f"Processed {rows_processed} rows")
    print(f"Fixed {rows_fixed} rows with taxonomy issues")
    print(f"Output saved to: {OUTPUT_FILE}")
    
    sport_counts = {}
    subtype_counts = {}
    for row in fixed_rows:
        sport = row['sport']
        subtype = row['sport_subtype']
        sport_counts[sport] = sport_counts.get(sport, 0) + 1
        subtype_counts[subtype] = subtype_counts.get(subtype, 0) + 1
    
    print("\n--- Sport Distribution ---")
    for sport, count in sorted(sport_counts.items(), key=lambda x: -x[1]):
        print(f"  {sport}: {count}")
    
    print("\n--- Subtype Distribution ---")
    for subtype, count in sorted(subtype_counts.items(), key=lambda x: -x[1]):
        print(f"  {subtype}: {count}")

if __name__ == '__main__':
    main()
