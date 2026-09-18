"""Boundary adapter for authorized social discovery inputs.

This module intentionally does not scrape login-gated pages or bypass platform controls.
Upstream integrations must provide API/feed/permitted-public records in a common shape.
"""

def extract_records(payload: dict):
    for item in payload.get("items", []):
        if not item.get("public_or_authorized", False):
            continue
        yield {
            "source_record_id": item.get("id"),
            "source_url": item.get("url"),
            "text": item.get("text",""),
            "published_at": item.get("published_at"),
            "author_key": item.get("author_key"),
            "metrics": item.get("metrics",{}),
        }
