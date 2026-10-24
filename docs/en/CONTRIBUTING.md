# Contributing to Forever Analyzer

Contributions, bug reports, and spell/item catalog updates for WoW Forever are welcome.

## Reporting Issues

1. Open an issue on [GitHub Issues](https://github.com/patitokun03-spec/Forever-Analyzer/issues).
2. Include the Warcraft Logs report code (if public), the fight name, the player/class involved, and a brief description of what was expected vs. what was displayed.

## Development Workflow

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/patitokun03-spec/Forever-Analyzer.git
   cd Forever-Analyzer
   ```
2. Initialize the local SQLite database:
   ```bash
   python database/seed.py
   ```
3. Start the server and test your changes against the built-in `demo` report (`http://localhost:3000`):
   ```bash
   python server.py
   ```
4. If you update the database catalog, make sure `database/seed_data.sql` is updated and passes `PRAGMA foreign_key_check` with no missing icons.
5. Submit a Pull Request against `main`.
