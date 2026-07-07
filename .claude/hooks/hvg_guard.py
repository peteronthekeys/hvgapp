#!/usr/bin/env python3
"""Lattice guard for Animation Studio Pro:
- PreToolUse: protect .env (GEMINI_API_KEY lives there)
- PostToolUse: type-drift reminder — the AI editor silently loses element types
  when ElementType (src/types.ts), the server updateSchema enum (server.ts), and
  PreviewPanel renderers fall out of sync (HVG_ROADMAP R3, the known defect class)."""
import json
import sys

try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)

ev = d.get("hook_event_name", "")
ti = d.get("tool_input") or {}
path = ti.get("file_path", "") or ""

if ev == "PreToolUse" and path.endswith("/.env"):
    sys.stderr.write(
        "LATTICE BLOCK: .env holds GEMINI_API_KEY and is never agent-edited. "
        "Use .env.example for structure changes."
    )
    sys.exit(2)

if ev == "PostToolUse" and (path.endswith("src/types.ts") or path.endswith("server.ts")):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": (
                "hvgapp lattice: you touched types.ts or server.ts. Verify the three-way sync "
                "before finishing: ElementType union (src/types.ts) ↔ updateSchema enum + system "
                "prompt (server.ts) ↔ PreviewPanel renderers. This drift is the app's known defect "
                "class (HVG_ROADMAP R3). Run `npm run lint` (tsc) after."
            ),
        }
    }))
