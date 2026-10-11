# Backup and restore

The version 1 JSON export contains application records and attachment metadata. It does **not** contain uploaded file bytes, owner passwords, session tokens, or environment secrets. Keep a separate, access-controlled copy of the attachment storage directory configured by `ATTACHMENTS_DIR` (default: `storage/uploads` relative to the application working directory).

## Creating a recoverable backup

1. Pause writes while taking the backup so database records and files describe the same point in time.
2. Export JSON through Settings → Backup, or take the operational PostgreSQL backup with `pg_dump`.
3. Copy the complete `ATTACHMENTS_DIR` tree, preserving its directory names and file names. File names are storage keys, not the display names shown in the application.
4. Store the database/JSON backup and the matching file tree together securely. Test recovery in a separate installation.

## Restoring a JSON export

1. Keep a current backup of the destination database and attachment files.
2. Copy the matching attachment file tree into the destination `ATTACHMENTS_DIR`, preserving relative paths. Do not remove existing files.
3. Select the JSON file on Settings → Backup and preview it. The server validates the schema, safe storage keys, references, duplicate attachment IDs/keys, and attachment presence, exact size, and supported content signatures.
4. Review the record counts and enter `RESTORE` to replace the current owner's personal records. File validation repeats immediately before the database transaction. Missing, unreadable, or mismatched files prevent any record deletion.

The transaction preserves the destination owner identity, password, and active sessions. Imported attachment metadata belongs to that owner; its opaque storage keys remain unchanged even when the source owner's ID differs. Download/delete authorization uses the owner-scoped database record rather than the directory prefix.

Restore never removes attachment files. Files no longer referenced after a restore remain on disk so an older backup can still refer to them. There is no automatic orphan cleanup. Presence, size, and type checks do not replace a cryptographic checksum or a full filesystem snapshot; version 1 does not include content hashes.

PostgreSQL operational backup/recovery and attachment-directory backup remain deployment responsibilities. JSON export alone is insufficient for complete file recovery.
