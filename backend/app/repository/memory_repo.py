"""In-memory EntryRepository for local development and tests.

Thread-safe enough for a single-process dev server; data is ephemeral and lost on
restart. Selected automatically when ``USE_FIRESTORE=false``.

v1.2: added async method wrappers for compatibility with async route handlers.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.models import Entry, EntryStats, FootprintInput, FootprintResult


class InMemoryEntryRepository:
    """EntryRepository backed by a process-local dictionary."""

    def __init__(self) -> None:
        """Start with an empty per-device store."""
        self._by_device: dict[str, list[Entry]] = {}

    def add(self, device_id: str, data: FootprintInput, result: FootprintResult) -> Entry:
        """Persist a new entry for the device and return it with id/timestamp."""
        entry = Entry(
            id=uuid.uuid4().hex,
            created_at=datetime.now(timezone.utc).isoformat(),
            device_id=device_id,
            input=data,
            result=result,
        )
        self._by_device.setdefault(device_id, []).append(entry)
        return entry

    def list_for_device(self, device_id: str, limit: int = 50) -> list[Entry]:
        """Return the device's entries, newest first."""
        entries = self._by_device.get(device_id, [])
        # Newest first.
        return sorted(entries, key=lambda e: e.created_at, reverse=True)[:limit]

    async def async_add(self, device_id: str, data: FootprintInput, result: FootprintResult) -> Entry:
        """Async wrapper — in-memory ops are instant, no thread needed."""
        return self.add(device_id, data, result)

    async def async_list_for_device(self, device_id: str, limit: int = 50) -> list[Entry]:
        """Async wrapper — in-memory ops are instant, no thread needed."""
        return self.list_for_device(device_id, limit=limit)

    async def async_stats_for_device(self, device_id: str) -> EntryStats:
        """Compute aggregate statistics across the device's history."""
        entries = self.list_for_device(device_id, limit=1000)
        if not entries:
            return EntryStats(
                total_entries=0, latest_tonnes=0, average_tonnes=0,
                minimum_tonnes=0, maximum_tonnes=0,
                trend_direction="stable", percent_change=0,
            )
        tonnes = [e.result.total_annual_tonnes for e in entries]
        avg = sum(tonnes) / len(tonnes)
        latest = tonnes[0]
        previous = tonnes[1] if len(tonnes) > 1 else None
        if previous is not None and previous > 0:
            pct = round((latest - previous) / previous * 100, 1)
            direction = "falling" if pct < -1 else "rising" if pct > 1 else "stable"
        else:
            pct = 0
            direction = "stable"
        return EntryStats(
            total_entries=len(entries),
            latest_tonnes=latest,
            average_tonnes=round(avg, 3),
            minimum_tonnes=min(tonnes),
            maximum_tonnes=max(tonnes),
            trend_direction=direction,
            percent_change=pct,
        )
