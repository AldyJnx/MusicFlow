"""
Utility functions for MusicFlow.
"""
import hashlib
import uuid
from typing import BinaryIO


def generate_uuid() -> str:
    """Generate a new UUID4 string."""
    return str(uuid.uuid4())


def calculate_file_hash(file: BinaryIO, chunk_size: int = 8192) -> str:
    """Calculate SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    for chunk in iter(lambda: file.read(chunk_size), b""):
        sha256_hash.update(chunk)
    file.seek(0)  # Reset file pointer
    return sha256_hash.hexdigest()


def ms_to_time_string(ms: int) -> str:
    """Convert milliseconds to human readable time string (MM:SS)."""
    seconds = ms // 1000
    minutes = seconds // 60
    seconds = seconds % 60
    return f"{minutes}:{seconds:02d}"


def time_string_to_ms(time_str: str) -> int:
    """Convert time string (MM:SS or HH:MM:SS) to milliseconds."""
    parts = time_str.split(':')
    if len(parts) == 2:
        minutes, seconds = map(int, parts)
        return (minutes * 60 + seconds) * 1000
    elif len(parts) == 3:
        hours, minutes, seconds = map(int, parts)
        return (hours * 3600 + minutes * 60 + seconds) * 1000
    raise ValueError(f"Invalid time format: {time_str}")
