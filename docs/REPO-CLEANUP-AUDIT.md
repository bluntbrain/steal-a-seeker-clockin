# Repository and deployment audit — 17 September 2026

The repository contains useful game code mixed with old visual experiments and generated evidence. Cleanup should improve the review path and remove obsolete tracked outputs. It should not remove gameplay assets, hide development history, or break test fixtures. No existing project files were deleted in this audit.

## Tracked-file snapshot

Decimal MB, measured from the current tracked working files (not Git compressed history):

| Area | Files | MB | Action |
|---|---:|---:|---|
| assets | 240 | 144.48 | Keep runtime imports; audit raw originals and superseded packs separately. Do not delete as a block. |
| verification | 671 | 88.59 | Archive bulk screenshots/logs outside the judge checkout. Keep a concise QA report and required replay fixtures. |
| output | 39 | 39.63 | Audit generated concepts; archive originals after checking source/build references. |
| design | 123 | 29.19 | Keep selected references and current screen specs; archive obsolete preview iterations. |
| submission | 5 | 9.54 | Keep current deck/demo/reviewer instructions. The older deck and demo script still need a final content refresh. |
| public | 2 | 8.00 | Runtime web assets; retain until imports and export build are checked. |
| server | 75 | 3.33 | Keep API, migrations, lockfile and tests. |
| android | 44 | 0.95 | Keep Gradle wrapper and app sources. Build outputs are already ignored. |
| publishing | 21 | 0.95 | Keep current receipt/listing; mark old versions historical. |
| src / shared / tests / scripts / docs | — | about 1.3 | Keep required sources/tests; index current docs and mark superseded docs. |

One real dependency prevents a blanket verification deletion: tests/campaign.test.ts and tests/fixtures/replay.ts import verification/campaign-routes.json. Move that fixture into tests/fixtures and update both imports before removing generated evidence folders. Check scripts and doc links too.

The local node_modules (about 1.3 GB), Android build/cache files (about 1 GB) and APK releases (about 1.1 GB) are largely ignored. Their disk usage does not mean they were pushed to GitHub. Local .git is about 291 MB; deleting tracked files in a future commit does not remove their old blobs. Do not rewrite hackathon commit history merely to make the repository look smaller.

## Review path improved now

README links to the current build, pricing, tutorial audit and deployment guide. The judge guide now describes tap controls, free campaign, Mainnet MWA and weekly pass gating. It no longer directs reviewers to obsolete joystick/decoy/devnet flows. Older pitch and demo material remains explicitly historical until updated.

## Railway upload failure

The rejected upload was **298,456,672 bytes** (298.46 MB / 284.63 MiB), with HTTP 413 from the upload path. That is the size rejected, not evidence of an exact platform cap.

[Railway's CLI upload implementation](https://github.com/railwayapp/cli/blob/master/src/controllers/upload.rs) gzips a source archive and reports its length when the server returns 413. It respects .railwayignore and .gitignore. Docker's ignore file takes effect later and is not enough to prevent a large CLI upload. Neither that source nor the [up command documentation](https://docs.railway.com/cli/up) establishes an exact numeric server-side cap. [Cloudflare's 413 documentation](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/4xx-client-error/error-413/) describes configurable plan/zone limits; it does not reveal Railway's upload endpoint configuration. Do not present 100 MB, 200 MB or 250 MB as verified for this endpoint.

The existing API-only deploy helper stages **109 files, 3,435,058 bytes (3.44 MB) before compression**. It includes server, shared and src/game plus the Docker/Railway config, not APKs or artwork. A dry-run mode now prints that size and rejects contexts above our own **25 MB safety budget**. This budget is not a Railway quota. A .railwayignore now also excludes large game/art/build folders from accidental root-level uploads.

Check without deploying:

```sh
node scripts/deploy-api.cjs --dry-run
```

Deploy to the existing service:

```sh
node scripts/deploy-api.cjs 1a98618e-5079-4b16-a07a-b5fcdbfadef9 a8b9380e-948f-4690-95b3-a3069f2e5275 fc20fdcd-565e-4d68-a37a-8f6893baf8b2
```

The tutorial fixes do not change the backend or require another service. No backend redeployment was needed for this patch.

## Signing audit

The release keystore is outside the checkout at ~/.config/steal-a-seeker/distribution.jks, with release-signing.json beside it. Both have 0600 permissions. The alias/password opens successfully with keytool and the new APK verifies against the same signing certificate.

The exact keystore blob is absent from reachable local Git history. Neither current signing password appears in the 2,475 historical blobs below 2 MB that were scanned. The only tracked/history keystore filename found is android/app/debug.keystore, the separate development signer. Ignore rules now explicitly cover signing config/backups, P12/PFX files and known treasury filenames too.

A fresh remote audit was blocked by unavailable GitHub authentication. Do not describe this as proof about every remote branch, prior fork, encoded secret or unrelated credential. No signing material or backup was added to the repository.

An AES-256 encrypted signing ZIP was created outside the repository and verified by decrypting and comparing both files. Its random password remains in a separate private config file. The draft email is addressed from ishan.lakhwani@gmail.com to hello@kraneapps.com. No email was sent.
