# database/seed.py
# Database seed and initialization script in Python for native SQLite

import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'forever.sqlite')
SEED_DATA_PATH = os.path.join(BASE_DIR, 'database', 'seed_data.sql')

def main():
    print(f'[Seed] Initializing SQLite database at: {DB_PATH}')
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if os.path.exists(SEED_DATA_PATH):
        with open(SEED_DATA_PATH, 'r', encoding='utf-8') as f:
            sql = f.read()
        cursor.executescript(sql)
        print(f'[Seed] Master seed executed successfully from {SEED_DATA_PATH}.')
    else:
        print(f'[Seed] Error: {SEED_DATA_PATH} not found.')

    conn.commit()

    # Print summary counts
    for table in ['classes', 'specs', 'abilities', 'items_consumables', 'enchants', 'encounters', 'items_equipment']:
        try:
            cnt = cursor.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f'  - {table}: {cnt} rows')
        except sqlite3.OperationalError:
            pass

    conn.close()
    print('[Seed] Database initialization complete.')

if __name__ == '__main__':
    main()
