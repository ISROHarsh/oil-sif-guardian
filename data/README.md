# Data Directory

This directory stores datasets, dictionaries, and versioned labels for OIL-SIF Guardian.

## Directory Structure
- `samples/`: Curated, sanitized sample incident reports for local evaluation and testing.
- `raw/`: Immutable raw ingestion logs (gitignored).
- `processed/`: Standardized, normalized reports with PII redacted (gitignored).
- `labels/`: Versioned annotation records (e.g. `gold_v1.json`).
- `features/`: Extracted feature sets and embeddings (gitignored).

## Strict Privacy Rule
Never commit real confidential operational records or identifying worker details to this directory.
