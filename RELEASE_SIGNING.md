# SOFT STACK Release Signing

The Android Release build uses these GitHub Actions secret names:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The keystore itself and all password values are intentionally excluded from Git. The workflow decodes the keystore only into the ephemeral GitHub Actions runner, uses it for `assembleRelease`, and the runner removes it after the job.

## Secure backup procedure

1. Keep the original `.jks` file in at least two encrypted locations, such as an encrypted password-manager attachment and an encrypted offline drive.
2. Store the keystore password, key alias, and key password in a password manager as separate secure fields. Do not place them in the repository, issue tracker, chat, or workflow YAML.
3. Record the release certificate SHA-256 fingerprint next to the app record, but never store private key material in the same unencrypted location as the fingerprint.
4. Periodically test restoring a copy into an isolated environment and verify that it can sign a test build. Never replace the original keystore during a restore test.
5. Treat loss of the keystore as permanent loss of the ability to publish updates signed as the same Android app identity.

GitHub Actions secrets are suitable for unattended builds, but GitHub does not reveal secret values after they are saved. Keep an independent encrypted backup of the keystore and its passwords.
