# server.py
# Local Python HTTP server for WoW Forever Log Analyzer
# Compatible with Windows and executable with standard library (sqlite3 + urllib + http.server)

import os
import sys
import json
import time
import sqlite3
import urllib.request
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get("PORT", 3000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
DB_PATH = os.path.join(BASE_DIR, 'forever.sqlite')
ICONS_DIR = os.path.join(PUBLIC_DIR, 'assets', 'icons')

os.makedirs(ICONS_DIR, exist_ok=True)

# Load environment variables from .env file if present
ENV_PATH = os.path.join(BASE_DIR, '.env')
if os.path.exists(ENV_PATH):
    try:
        with open(ENV_PATH, 'r', encoding='utf-8') as ef:
            for line in ef:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    k = k.strip()
                    v = v.strip().strip('"\'')
                    if k and k not in os.environ:
                        os.environ[k] = v
    except Exception as e:
        print(f"[Server] Note: could not load .env: {e}")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ── WCL GRAPHQL ENGINE & CACHE ──────────────────────────────────────────────

_token_cache = {
    "access_token": None,
    "expires_at": 0
}

def get_wcl_filter_spell_ids():
    """Queries abilities and consumables from SQLite to build a compact WCL filter expression."""
    conn = get_db()
    ability_rows = conn.execute('SELECT spell_id FROM abilities').fetchall()
    consumable_rows = conn.execute('SELECT item_id as spell_id FROM items_consumables').fetchall()
    conn.close()

    ids = set()
    for r in ability_rows:
        if r['spell_id']: ids.add(r['spell_id'])
    for r in consumable_rows:
        if r['spell_id']: ids.add(r['spell_id'])

    # Special IDs for resurrections, explosives, and fixed combat mechanics (Classic 60 & Forever)
    special_ids = [
        # Resurrections & Externals
        20608, 20707, 20739, 20742, 20747, 20748, 20749, 20750, 20758,
        20484, 50769, 21849, 21850,
        # Classic 60 Engineering Explosives
        13241,  # Goblin Sapper Charge
        13240,  # Goblin Sapper Charge (Cast)
        10646,  # Goblin Sapper Charge (Item)
        23063,  # Dense Dynamite
        19769,  # Thorium Grenade
        4054,   # Rough Dynamite
        4064,   # Rough Copper Bomb
        4068,   # Iron Grenade
        # Classic 60 Combat Potions & Runes
        3169,   # Limited Invulnerability Potion
        6615,   # Free Action Potion
        11359,  # Restorative Potion
        24364,  # Living Action Potion
        27869,  # Dark Rune
        16666,  # Demonic Rune
        17528,  # Mighty Rage Potion
        17531,  # Major Mana Potion
        17534,  # Major Healing Potion
    ]
    for s_id in special_ids:
        ids.add(s_id)

    return ",".join(str(i) for i in ids)

def get_wcl_token(client_id, client_secret):
    """Obtains or returns cached OAuth2 access token for Warcraft Logs v2 API."""
    now = time.time()
    if _token_cache["access_token"] and _token_cache["expires_at"] > now + 60:
        return _token_cache["access_token"]

    token_url = "https://www.warcraftlogs.com/oauth/token"
    payload = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret
    }).encode("utf-8")

    req = urllib.request.Request(token_url, data=payload, headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "WoW-Forever-Log-Analyzer/3.1"
    })

    with urllib.request.urlopen(req, timeout=10) as resp:
        if resp.status != 200:
            raise Exception(f"WCL OAuth token request failed with status {resp.status}")
        data = json.loads(resp.read().decode("utf-8"))
        token = data.get("access_token")
        expires_in = data.get("expires_in", 3600)
        _token_cache["access_token"] = token
        _token_cache["expires_at"] = now + expires_in
        return token

def execute_wcl_graphql(token, query_str):
    """Executes a GraphQL query against Warcraft Logs v2 API."""
    api_url = "https://www.warcraftlogs.com/api/v2/client"
    body = json.dumps({"query": query_str}).encode("utf-8")

    req = urllib.request.Request(api_url, data=body, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "User-Agent": "WoW-Forever-Log-Analyzer/3.1"
    })

    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        if "errors" in data and data["errors"]:
            raise Exception(data["errors"][0].get("message", "WCL GraphQL Error"))
        return data

# ── REQUEST HANDLER ──────────────────────────────────────────────────────────

class ForeverHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. API: Classes & Specs
        if path == '/api/data/classes':
            self.send_json_response(self.handle_get_classes())
            return

        # 2. API: Abilities
        elif path == '/api/data/abilities':
            qs = urllib.parse.parse_qs(parsed.query)
            class_id = qs.get('class', [None])[0]
            self.send_json_response(self.handle_get_abilities(class_id))
            return

        # 3. API: Consumables
        elif path == '/api/data/consumables':
            self.send_json_response(self.handle_get_consumables())
            return

        # 4. API: Enchants
        elif path == '/api/data/enchants':
            self.send_json_response(self.handle_get_enchants())
            return

        # 5. API: Encounters
        elif path == '/api/data/encounters':
            self.send_json_response(self.handle_get_encounters())
            return

        # 6. API: Items Equipment
        elif path == '/api/data/items':
            self.send_json_response(self.handle_get_items())
            return

        # 7. API: Demo Log
        elif path == '/api/demo/log':
            demo_path = os.path.join(PUBLIC_DIR, 'demo_log.json')
            if os.path.exists(demo_path):
                with open(demo_path, 'r', encoding='utf-8') as f:
                    self.send_json_response(json.load(f))
            else:
                self.send_json_response({"error": "Demo log not found"}, status=404)
            return

        # 7. API: Icon Proxy
        elif path.startswith('/api/icon/'):
            icon_name = path[len('/api/icon/'):]
            self.handle_icon_request(icon_name)
            return

        # 8. Report SPA Route: /report/:logId -> serve index.html
        elif path.startswith('/report/'):
            self.path = '/index.html'
            return super().do_GET()

        # Fallback to static files in public/
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len) if content_len > 0 else b'{}'
        
        try:
            body = json.loads(post_body.decode('utf-8'))
        except Exception:
            body = {}

        # 1. API: Audit Log
        if path == '/api/audit':
            log_id = body.get('logId', '').strip()
            if not log_id:
                self.send_json_response({"error": "Missing logId"}, status=400)
                return

            # Special support for Demo / Beta mode
            if log_id.lower() == 'demo' or 'demo' in log_id.lower():
                demo_path = os.path.join(PUBLIC_DIR, 'demo_log.json')
                if os.path.exists(demo_path):
                    with open(demo_path, 'r', encoding='utf-8') as f:
                        self.send_json_response(json.load(f))
                    return

            # Check SQLite cache
            cache_key = f'v2_{log_id}'
            cached = self.get_cached_log(cache_key)
            if cached and not body.get('bypassCache'):
                print(f"[Server] Cache HIT for {log_id}")
                self.send_json_response(json.loads(cached))
                return

            # Check for WCL API credentials
            wcl_id = os.environ.get('WCL_CLIENT_ID')
            wcl_secret = os.environ.get('WCL_CLIENT_SECRET')

            if not wcl_id or not wcl_secret:
                # If credentials are not configured, serve demo log with informational notice
                print(f"[Server] No WCL credentials configured. Serving demo log as fallback.")
                demo_path = os.path.join(PUBLIC_DIR, 'demo_log.json')
                if os.path.exists(demo_path):
                    with open(demo_path, 'r', encoding='utf-8') as f:
                        self.send_json_response(json.load(f))
                else:
                    self.send_json_response({"error": "WCL credentials not configured and demo log missing"}, status=500)
                return

            # Fetch live log from Warcraft Logs GraphQL v2 API
            try:
                print(f"[Server] Cache MISS for {log_id}. Fetching from Warcraft Logs API...")
                token = get_wcl_token(wcl_id, wcl_secret)
                all_filter_ids = get_wcl_filter_spell_ids()

                filter_exp = f"type = 'death' OR type = 'combatantinfo' OR (type IN ('cast', 'damage', 'interrupt', 'resurrect', 'applybuff', 'applybuffstack', 'refreshbuff', 'removebuff', 'applydebuff', 'refreshdebuff', 'removedebuff') AND ability.id IN ({all_filter_ids}))"

                # Initial query
                query = f"""
                {{
                    reportData {{
                        report(code: "{log_id}") {{
                            title
                            fights {{ id name startTime endTime kill difficulty }}
                            masterData {{ actors {{ id name subType icon type }} }}
                            events(startTime: 0, endTime: 999999999999, filterExpression: "{filter_exp}") {{ data nextPageTimestamp }}
                            deaths: events(startTime: 0, endTime: 999999999999, dataType: Deaths) {{ data nextPageTimestamp }}
                        }}
                    }}
                }}
                """

                res_data = execute_wcl_graphql(token, query)
                report = res_data.get("data", {}).get("reportData", {}).get("report")
                if not report:
                    raise Exception("Report not found or is private.")

                if not report.get("events"): report["events"] = {"data": []}
                if not report.get("deaths"): report["deaths"] = {"data": []}

                next_event = report["events"].get("nextPageTimestamp")
                next_death = report["deaths"].get("nextPageTimestamp")

                # Handle pagination if report exceeds 10k events
                while next_event is not None or next_death is not None:
                    ev_str = f'events(startTime: {next_event}, endTime: 999999999999, killType: All, filterExpression: "{filter_exp}") {{ data nextPageTimestamp }}' if next_event is not None else ''
                    death_str = f'deaths: events(startTime: {next_death}, endTime: 999999999999, killType: All, dataType: Deaths) {{ data nextPageTimestamp }}' if next_death is not None else ''
                    page_query = f"""{{ reportData {{ report(code: "{log_id}") {{ {ev_str} {death_str} }} }} }}"""

                    page_res = execute_wcl_graphql(token, page_query)
                    page_report = page_res.get("data", {}).get("reportData", {}).get("report", {})

                    if next_event is not None and "events" in page_report and page_report["events"].get("data"):
                        report["events"]["data"].extend(page_report["events"]["data"])
                        next_event = page_report["events"].get("nextPageTimestamp")
                    else:
                        next_event = None

                    if next_death is not None and "deaths" in page_report and page_report["deaths"].get("data"):
                        report["deaths"]["data"].extend(page_report["deaths"]["data"])
                        next_death = page_report["deaths"].get("nextPageTimestamp")
                    else:
                        next_death = None

                # Merge deaths into events data and sort by timestamp
                if report.get("deaths") and report["deaths"].get("data"):
                    report["events"]["data"].extend(report["deaths"]["data"])
                report["events"]["data"].sort(key=lambda x: x.get("timestamp", 0))

                # Store complete report in SQLite logs_cache
                report_json_str = json.dumps(res_data)
                self.save_cached_log(cache_key, report_json_str)
                print(f"[Server] Successfully fetched and cached report {log_id} ({len(report['events']['data'])} events).")

                self.send_json_response(res_data)
                return
            except Exception as e:
                print(f"[Server] WCL fetch error for {log_id}: {e}")
                self.send_json_response({"error": str(e)}, status=500)
                return

        # 2. API: DPS calculation
        elif path == '/api/dps':
            log_id = body.get('logId')
            player_id = body.get('playerId')
            fight_ids = body.get('fightIDs')
            start_time = body.get('startTime')
            end_time = body.get('endTime')

            if not log_id or not player_id:
                self.send_json_response({"error": "Missing required parameters: logId, playerId"}, status=400)
                return

            # Construct cache key
            if fight_ids and isinstance(fight_ids, list) and len(fight_ids) > 0:
                cache_key = f"v2_dps_{log_id}_fights_{'_'.join(str(f) for f in fight_ids)}_{player_id}"
            elif start_time is not None and end_time is not None:
                cache_key = f"v2_dps_{log_id}_{start_time}_{end_time}_{player_id}"
            else:
                self.send_json_response({"error": "Missing either fightIDs or startTime/endTime"}, status=400)
                return

            cached_dps = self.get_cached_log(cache_key)
            if cached_dps:
                self.send_json_response(json.loads(cached_dps))
                return

            # If log is demo or WCL credentials are not present, return a sensible default
            wcl_id = os.environ.get('WCL_CLIENT_ID')
            wcl_secret = os.environ.get('WCL_CLIENT_SECRET')

            if not wcl_id or not wcl_secret or log_id.lower() == 'demo':
                default_dps = {"dps": 1150, "total": 138000, "isHealing": False}
                self.send_json_response(default_dps)
                return

            try:
                token = get_wcl_token(wcl_id, wcl_secret)
                if fight_ids and isinstance(fight_ids, list) and len(fight_ids) > 0 and fight_ids[0] == 'all':
                    dps_query = f"""
                    {{ reportData {{ report(code: "{log_id}") {{
                        fights {{ id startTime endTime }}
                        damage: table(dataType: DamageDone, startTime: 0, endTime: 999999999999, sourceID: {player_id})
                        healing: table(dataType: Healing, startTime: 0, endTime: 999999999999, sourceID: {player_id})
                    }} }} }}
                    """
                elif fight_ids and isinstance(fight_ids, list) and len(fight_ids) > 0:
                    dps_query = f"""
                    {{ reportData {{ report(code: "{log_id}") {{
                        fights {{ id startTime endTime }}
                        damage: table(dataType: DamageDone, fightIDs: [{','.join(str(f) for f in fight_ids)}], sourceID: {player_id})
                        healing: table(dataType: Healing, fightIDs: [{','.join(str(f) for f in fight_ids)}], sourceID: {player_id})
                    }} }} }}
                    """
                else:
                    dps_query = f"""
                    {{ reportData {{ report(code: "{log_id}") {{
                        fights {{ id startTime endTime }}
                        damage: table(dataType: DamageDone, startTime: {start_time}, endTime: {end_time}, sourceID: {player_id})
                        healing: table(dataType: Healing, startTime: {start_time}, endTime: {end_time}, sourceID: {player_id})
                    }} }} }}
                    """

                dps_res = execute_wcl_graphql(token, dps_query)
                rep = dps_res.get("data", {}).get("reportData", {}).get("report", {})
                entries_dmg = rep.get("damage", {}).get("data", {}).get("entries", [])
                entries_heal = rep.get("healing", {}).get("data", {}).get("entries", [])

                dmg_total = sum(e.get("total", 0) for e in entries_dmg)
                heal_total = sum(e.get("total", 0) for e in entries_heal)

                fights = rep.get("fights", [])
                duration_sec = 1
                if fight_ids and isinstance(fight_ids, list) and len(fight_ids) > 0 and fight_ids[0] == 'all':
                    total_dur = sum((f.get("endTime", 0) - f.get("startTime", 0)) for f in fights)
                    duration_sec = max(1, total_dur / 1000)
                elif fight_ids and isinstance(fight_ids, list) and len(fight_ids) > 0:
                    matching = [f for f in fights if f.get("id") in fight_ids or str(f.get("id")) in fight_ids]
                    total_dur = sum((f.get("endTime", 0) - f.get("startTime", 0)) for f in matching)
                    duration_sec = max(1, total_dur / 1000)
                elif start_time is not None and end_time is not None:
                    duration_sec = max(1, (end_time - start_time) / 1000)

                is_healer = heal_total > dmg_total * 1.5
                if is_healer:
                    result = {"dps": round(heal_total / duration_sec), "total": heal_total, "isHealing": True}
                else:
                    result = {"dps": round(dmg_total / duration_sec), "total": dmg_total, "isHealing": False}

                self.save_cached_log(cache_key, json.dumps(result))
                self.send_json_response(result)
                return
            except Exception as e:
                print(f"[Server] DPS calculation error: {e}")
                self.send_json_response({"error": str(e)}, status=500)
                return

        self.send_json_response({"error": "Not Found"}, status=404)

    def handle_get_classes(self):
        conn = get_db()
        classes = conn.execute('SELECT * FROM classes ORDER BY name ASC').fetchall()
        specs = conn.execute('SELECT * FROM specs ORDER BY name ASC').fetchall()
        conn.close()

        res = []
        for c in classes:
            c_dict = dict(c)
            c_dict['specs'] = [dict(s) for s in specs if s['class_id'] == c['id']]
            res.append(c_dict)
        return res

    def handle_get_abilities(self, class_id=None):
        conn = get_db()
        if class_id:
            rows = conn.execute('SELECT * FROM abilities WHERE class_id = ? OR class_id IS NULL ORDER BY name ASC', (class_id,)).fetchall()
        else:
            rows = conn.execute('SELECT * FROM abilities ORDER BY name ASC').fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def handle_get_consumables(self):
        conn = get_db()
        rows = conn.execute('SELECT * FROM items_consumables ORDER BY order_priority ASC, name ASC').fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def handle_get_enchants(self):
        conn = get_db()
        rows = conn.execute('SELECT * FROM enchants ORDER BY name ASC').fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def handle_get_encounters(self):
        conn = get_db()
        rows = conn.execute('SELECT * FROM encounters ORDER BY zone ASC, name ASC').fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def handle_get_items(self):
        conn = get_db()
        rows = conn.execute('SELECT item_id, name, icon, quality, slot, raid_zone FROM items_equipment ORDER BY quality DESC, name ASC').fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_cached_log(self, cache_key):
        conn = get_db()
        row = conn.execute('SELECT log_data FROM logs_cache WHERE log_id = ?', (cache_key,)).fetchone()
        conn.close()
        return row['log_data'] if row else None

    def save_cached_log(self, cache_key, data_str):
        conn = get_db()
        conn.execute('INSERT OR REPLACE INTO logs_cache (log_id, log_data) VALUES (?, ?)', (cache_key, data_str))
        conn.commit()
        conn.close()

    def handle_icon_request(self, icon_file):
        local_path = os.path.join(ICONS_DIR, icon_file)
        if os.path.exists(local_path):
            self.serve_file(local_path, 'image/jpeg', is_immutable=True)
            return

        # Attempt to download on-demand from Wowhead / Zamimg CDN
        url = f'https://wow.zamimg.com/images/wow/icons/large/{icon_file}'
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status == 200:
                    data = resp.read()
                    with open(local_path, 'wb') as f:
                        f.write(data)
                    self.send_response(200)
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', str(len(data)))
                    self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
                    return
        except Exception:
            pass

        # Fallback to default questionmark icon
        fallback_path = os.path.join(ICONS_DIR, 'inv_misc_questionmark.jpg')
        if os.path.exists(fallback_path):
            self.serve_file(fallback_path, 'image/jpeg', is_immutable=False)
        else:
            self.send_response(404)
            self.end_headers()

    def serve_file(self, file_path, content_type, is_immutable=False):
        try:
            with open(file_path, 'rb') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(data)))
            if is_immutable:
                self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data)
        except Exception:
            self.send_response(500)
            self.end_headers()

    def send_json_response(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

def run():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, ForeverHandler)
    print(f"[WoW Forever] Server running on http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[WoW Forever] Server stopped.")

if __name__ == '__main__':
    run()
