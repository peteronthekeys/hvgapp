#!/usr/bin/env python3
"""Lattice: block git commit/push on protected branches.
Standing directive (Peter, 2026-07-06): never work on main."""
import json
import re
import subprocess
import sys

try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)

cmd = (d.get("tool_input") or {}).get("command", "")
if not re.search(r"\bgit\b[^|;&]*\b(commit|push)\b", cmd):
    sys.exit(0)

m = re.search(r"git\s+-C\s+([^\s;|&]+)", cmd)
cwd = m.group(1) if m else (d.get("cwd") or ".")
try:
    br = subprocess.run(
        ["git", "-C", cwd, "branch", "--show-current"],
        capture_output=True, text=True, timeout=5,
    ).stdout.strip()
except Exception:
    sys.exit(0)

if br in ("main", "master"):
    sys.stderr.write(
        f"LATTICE BLOCK: {cwd} is on protected branch '{br}'. "
        "Create a work branch first (git switch -c <type>/<slug>), then commit there. "
        "Standing directive (Peter, 2026-07-06): never commit or push on main. "
        "Merges to main happen only via PR with Peter's approval."
    )
    sys.exit(2)
