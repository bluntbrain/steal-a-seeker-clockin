#!/usr/bin/env python3
"""Capture only structured SeekerWallet diagnostics from our running Android app."""
import json
import pathlib
import subprocess
import sys

adb = str(pathlib.Path.home() / 'Library/Android/sdk/platform-tools/adb')
serial = sys.argv[1] if len(sys.argv) > 1 else None
command = [adb] + (['-s', serial] if serial else [])
package = 'com.bluntbrain.stealaseeker'
pid = subprocess.run(command + ['shell', 'pidof', package], capture_output=True, text=True)
if pid.returncode or not pid.stdout.strip():
    sys.exit('Connect and unlock the phone, then open Steal a Seeker before capturing.')
process = subprocess.Popen(command + ['logcat', '--pid=' + pid.stdout.split()[0], '-v', 'brief', 'ReactNativeJS:I', '*:S'], stdout=subprocess.PIPE, text=True)
try:
    for line in process.stdout:
        marker = '[SeekerWallet]'
        if marker not in line:
            continue
        try:
            payload = line.split(marker, 1)[1]
            entry = json.loads(payload[payload.index('{'):payload.rindex('}') + 1])
        except (ValueError, TypeError):
            continue
        if isinstance(entry, dict) and set(entry) == {'at', 'id', 'stage', 'details'}:
            print(json.dumps(entry), flush=True)
except KeyboardInterrupt:
    pass
finally:
    process.terminate()
