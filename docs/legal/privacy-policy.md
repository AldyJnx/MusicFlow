# MusicFlow Privacy Policy Draft

Last updated: 2026-08-16

MusicFlow processes account identity, device tokens, music activity, saved
content, followed artists, equalizer preferences and diagnostics to provide
playback, recommendations, synchronization, notifications and support.

Authentication data is stored in PostgreSQL; media is delivered through
Cloudflare R2; device tokens are processed by the configured push delivery
provider; operational errors may be processed by Sentry when configured.
Passwords are stored as hashes.

Users can disable notifications in the application and can delete their
account in Profile or at `/account-deletion`. Account deletion removes the
account and data linked by the application database, except records that must
be retained to meet legal obligations.

Before publication, replace this draft with counsel-reviewed retention periods,
controller identity, contact address, lawful bases, international transfer
terms and jurisdiction-specific rights.
