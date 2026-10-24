-- database/schema.sql
-- Relational database schema for WoW Forever Log Analyzer

CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS specs (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'Tank', 'Healer', 'Melee', 'Ranged'
    icon TEXT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS abilities (
    spell_id INTEGER PRIMARY KEY,
    class_id TEXT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    category INTEGER DEFAULT 1, -- 1: Primary, 2: CD/Secondary, 3: Trinket/Proc, 4: Interrupt/Kick, 5: Consumable
    is_interrupt BOOLEAN DEFAULT 0,
    is_mechanic BOOLEAN DEFAULT 0,
    is_res BOOLEAN DEFAULT 0,
    tracking_enabled BOOLEAN DEFAULT 1,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS items_consumables (
    item_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Flask', 'Battle Elixir', 'Guardian Elixir', 'Food', 'Scroll', 'Potion', 'Healthstone', 'Rune', 'Other'
    order_priority INTEGER DEFAULT 99,
    is_in_combat BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enchants (
    enchant_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'inv_misc_questionmark',
    slot TEXT, -- 'Weapon', 'Head', 'Shoulder', 'Chest', etc.
    optimal_specs_best TEXT, -- JSON array of specs
    optimal_specs_alt TEXT   -- JSON array of specs
);

CREATE TABLE IF NOT EXISTS encounters (
    encounter_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    icon TEXT DEFAULT 'inv_misc_questionmark'
);

CREATE TABLE IF NOT EXISTS items_equipment (
    item_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'inv_misc_questionmark',
    quality INTEGER DEFAULT 3,
    slot TEXT,
    raid_zone TEXT
);

CREATE TABLE IF NOT EXISTS logs_cache (
    log_id TEXT PRIMARY KEY,
    log_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_abilities_class ON abilities(class_id);
CREATE INDEX IF NOT EXISTS idx_abilities_category ON abilities(category);
CREATE INDEX IF NOT EXISTS idx_consumables_cat ON items_consumables(category);
CREATE INDEX IF NOT EXISTS idx_equipment_zone ON items_equipment(raid_zone);
