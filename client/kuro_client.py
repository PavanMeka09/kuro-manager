#!/usr/bin/env python3
"""
KURO MANAGER - Python Client Integration Example
Can be compiled to a standalone EXE using PyInstaller:
    pip install pyinstaller requests
    pyinstaller --onefile kuro_client.py
"""

import sys
import json
import argparse
import urllib.request
import urllib.error

def check_authorization(server_url: str, registration_number: str, consume_credits: int = 0, api_key: str = ""):
    endpoint = server_url.rstrip("/") + "/api/authorize"
    
    payload = {
        "registrationNumber": registration_number,
    }
    if consume_credits > 0:
        payload["consumeCredits"] = consume_credits
        payload["reason"] = "Python EXE Client Execution"

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "Kuro-Python-Client/1.0")
    if api_key:
        req.add_header("x-kuro-api-key", api_key)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = response.read().decode("utf-8")
            return json.loads(body), response.status
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return json.loads(body), e.code
        except Exception:
            return {"authorized": False, "message": f"HTTP Error {e.code}"}, e.code
    except urllib.error.URLError as e:
        return {"authorized": False, "message": f"Network Error: {e.reason}"}, 0

def main():
    parser = argparse.ArgumentParser(description="Kuro Manager Python Authorization Client")
    parser.add_argument("--server", default="http://localhost:3000", help="Kuro Manager Server URL")
    parser.add_argument("--key", default="KURO-1001", help="Registration Number")
    parser.add_argument("--consume", type=int, default=0, help="Credits to consume (0 to inspect balance)")
    parser.add_argument("--api-key", default="", help="Optional client API key")
    
    args = parser.parse_args()

    print(f"[INFO] Querying Kuro Manager at {args.server} for license: {args.key}...")
    resp, code = check_authorization(args.server, args.key, args.consume, args.api_key)

    if resp.get("authorized"):
        print(f"[SUCCESS] Authorization Granted! Remaining Credits: {resp.get('creditsRemaining')}")
        sys.exit(0)
    else:
        print(f"[DENIED] Authorization Failed: {resp.get('message')} (HTTP {code})")
        sys.exit(1)

if __name__ == "__main__":
    main()
