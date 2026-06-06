# Security Policy

ZKVault is a zero-knowledge personal credential vault: all encryption and decryption happen in your browser, and the server only ever stores ciphertext. Security reports are taken seriously.

## Supported versions

This is a `0.x` project; only the latest release receives security fixes.

| Version | Supported |
| ------- | --------- |
| latest (`0.x`) | yes |
| older | no |

## Reporting a vulnerability

Report security issues **privately** - do not open a public issue or pull request for a vulnerability.

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and click **Report a vulnerability** (Security advisories). This keeps the report confidential until a fix is ready.

Where possible, include a description, the affected version or commit, reproduction steps or a proof of concept, and the impact.

What to expect:
- Acknowledgement within about 72 hours.
- A fix or mitigation plan once the issue is confirmed; severity drives priority.
- Coordinated disclosure - please allow a reasonable window before any public write-up. Credit is given unless you prefer to stay anonymous.

## Scope and threat model

ZKVault is end-to-end encrypted; the full security model and its honest limits live in the in-app docs (`/docs/bao-mat`).

In scope (please report):
- Any way the server, database, or network could obtain plaintext, keys, or the master password.
- Weaknesses in the encryption, key derivation (Argon2id), envelope key-wrapping, the recovery-key flow, or authentication.
- Row-Level-Security bypasses, injection, XSS / CSP gaps, or dependency vulnerabilities that affect confidentiality.

Out of scope (known limits by design, not bugs):
- A compromised device (keylogger or malware) - the master password can be captured as it is typed.
- Web supply chain: a compromised host or dependency could serve malicious JavaScript. Mitigated by CSP, pinned dependencies, the PWA, and self-hosting, but not fully solvable for web vaults.
- Losing both the master password and the recovery key + backup - the data is unrecoverable by design (there is no password reset).
- A leaked or weak master password - it derives both the login secret and the master key, so it grants full access. Biometric unlock and TOTP are conveniences, not extra factors that protect the vault.
