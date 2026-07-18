# Security Policy

## Supported Versions

Within is under active development. Security fixes are applied to the latest
version on the `main` branch.

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public issue**.

Instead, report it privately:

- Use GitHub's [private vulnerability reporting](https://github.com/aliffrhn/within/security/advisories/new), or
- Email **nomunyom@gmail.com** with a description of the issue and steps to reproduce.

You can expect an acknowledgment within a few days. Please give us a reasonable
window to investigate and fix the issue before any public disclosure.

## Scope Notes

Within is designed to be local-first:

- Audio is processed locally by Whisper and never uploaded.
- The optional summary feature sends transcript text (not audio) to the
  configured OpenAI-compatible endpoint.
- Uploaded temp files are deleted after transcription.

Reports about data leaving the machine outside of these documented paths are
especially important to us.
