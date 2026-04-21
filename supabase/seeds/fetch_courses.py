#!/usr/bin/env python3
# Regenerate supabase/migrations/20260421120100_courses_seed.sql from
# OpenStreetMap via the Overpass API (leisure=golf_course, US, by state).
# Run once during Phase 5b; re-run manually if course data needs refreshing.
#
# Usage: python3 supabase/seeds/fetch_courses.py
# Requires: python3 (standard library only).
# Output:   writes supabase/migrations/20260421120100_courses_seed.sql
#
# Attribution: course data © OpenStreetMap contributors, ODbL.
# https://www.openstreetmap.org/copyright

from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import List, Optional, Set, Tuple

OVERPASS = "https://overpass-api.de/api/interpreter"
STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
    "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
    "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
    "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
    "DC",
]

QUERY_TMPL = """[out:json][timeout:120];
area["ISO3166-2"="US-{state}"]->.region;
(
  node["leisure"="golf_course"](area.region);
  way["leisure"="golf_course"](area.region);
  relation["leisure"="golf_course"](area.region);
);
out center tags;"""


def fetch_state(code: str, attempts: int = 3) -> List[dict]:
    body = urllib.parse.urlencode({"data": QUERY_TMPL.format(state=code)}).encode()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "pindr-course-seed/1.0 (phase-5b; one-shot seed)",
    }
    for i in range(attempts):
        try:
            req = urllib.request.Request(OVERPASS, data=body, method="POST", headers=headers)
            with urllib.request.urlopen(req, timeout=180) as resp:
                return json.loads(resp.read()).get("elements", [])
        except Exception as e:
            wait = 5 * (i + 1)
            print(f"  {code}: attempt {i + 1} failed ({e}); retrying in {wait}s")
            time.sleep(wait)
    raise RuntimeError(f"{code}: exhausted retries")


def normalize(el: dict, default_state: str) -> Optional[dict]:
    tags = el.get("tags", {})
    name = (tags.get("name") or "").strip()
    if not name:
        return None
    lat = el.get("lat") or el.get("center", {}).get("lat")
    lon = el.get("lon") or el.get("center", {}).get("lon")
    if lat is None or lon is None:
        return None
    state = (tags.get("addr:state") or default_state).strip()
    if len(state) != 2:
        state = default_state
    city = (tags.get("addr:city") or "").strip() or None
    # Restrict to public/muni-ish when access is clearly set; keep unknown.
    access = (tags.get("access") or "").lower()
    is_public = access not in ("private", "members")
    return {
        "name": name,
        "city": city,
        "state": state.upper(),
        "lat": float(lat),
        "lon": float(lon),
        "is_public": is_public,
    }


def sql_quote(s: Optional[str]) -> str:
    if s is None:
        return "null"
    return "'" + s.replace("'", "''") + "'"


def main() -> None:
    rows: List[dict] = []
    seen: Set[Tuple[str, float, float]] = set()
    for i, code in enumerate(STATES, 1):
        print(f"[{i}/{len(STATES)}] fetching {code}...")
        elements = fetch_state(code)
        before = len(rows)
        for el in elements:
            row = normalize(el, code)
            if row is None:
                continue
            key = (row["name"].lower(), round(row["lat"], 4), round(row["lon"], 4))
            if key in seen:
                continue
            seen.add(key)
            rows.append(row)
        print(f"  +{len(rows) - before} (running total: {len(rows)})")
        # Be polite to Overpass.
        time.sleep(1.0)

    rows.sort(key=lambda r: (r["state"], r["name"].lower()))
    out_path = (
        Path(__file__).resolve().parents[1]
        / "migrations"
        / "20260421120100_courses_seed.sql"
    )
    with out_path.open("w") as f:
        f.write(
            "-- Course seed sourced from OpenStreetMap (leisure=golf_course, US).\n"
            "-- Regenerate via supabase/seeds/fetch_courses.py.\n"
            "-- Course data © OpenStreetMap contributors, ODbL.\n\n"
        )
        batch_size = 500
        for start in range(0, len(rows), batch_size):
            batch = rows[start : start + batch_size]
            f.write(
                "insert into public.courses "
                "(name, city, state, country, location, is_public) values\n"
            )
            values = []
            for r in batch:
                values.append(
                    "  ({name}, {city}, {state}, 'US', "
                    "ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)::geography, {pub})"
                    .format(
                        name=sql_quote(r["name"]),
                        city=sql_quote(r["city"]),
                        state=sql_quote(r["state"]),
                        lon=r["lon"],
                        lat=r["lat"],
                        pub="true" if r["is_public"] else "false",
                    )
                )
            f.write(",\n".join(values))
            f.write(";\n\n")

    print(f"\nwrote {len(rows)} courses to {out_path}")


if __name__ == "__main__":
    main()
