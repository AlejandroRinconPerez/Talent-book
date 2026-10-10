import os
import re
import json

# Concatenate all parts
parts = [f"/tmp/v2_part{i}.txt" for i in range(1, 15)]
full_text = ""
for p in parts:
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            full_text += f.read() + "\n"

# If /tmp/v2_part1.txt doesn't exist on disk in /tmp, check ./v2_part
if not full_text.strip():
    for i in range(1, 15):
        p = f"./v2_part{i}.txt"
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                full_text += f.read() + "\n"

print("Read length:", len(full_text))
