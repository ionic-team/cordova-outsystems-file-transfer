## [1.0.8](https://github.com/ionic-team/cordova-outsystems-file-transfer/compare/1.0.7...1.0.8) (2026-09-18)


### Bug Fixes

* Cordova iOS 8 / MABS 13 compatibility and SPM support ([#24](https://github.com/ionic-team/cordova-outsystems-file-transfer/issues/24)) ([3cabdd0](https://github.com/ionic-team/cordova-outsystems-file-transfer/commit/3cabdd013f11f71caab1ff0bcc26a698d238cbb8))

## [1.0.7](https://github.com/ionic-team/cordova-outsystems-file-transfer/compare/1.0.6...1.0.7) (2026-08-28)


### Bug Fixes

* **outsystems-wrapper:** Allow legacy clobber in new methods ([#23](https://github.com/ionic-team/cordova-outsystems-file-transfer/issues/23)) ([9f37cea](https://github.com/ionic-team/cordova-outsystems-file-transfer/commit/9f37ceac29fe8e9431007644f1341258cdc2dd2b))

## [1.0.6](https://github.com/ionic-team/cordova-outsystems-file-transfer/compare/1.0.5...1.0.6) (2026-07-14)

## [1.0.5]

### 2026-03-09

### Fixes

- **ios** Update to verison of IONFileTransferLib built with Xcode 16 (version 1.0.3).

## [1.0.4]

### 2026-02-03

### Fixes

- **ios** Return error response body on HTTP error in upload or download.
- **ios** Only notify of progress when HTTP code is successful.
- **ios** Return error on HTTP errors instead of success for download.

## [1.0.3]

### 2026-01-12

### Fixes

- **android** fix upload with params

### 2026-01-13

### Chores

- **android**: Remove unused dependencies to `oscore` and `oscordova`.

## [1.0.2]

### 2025-12-30

### Fixes

- **iOS** correct `responseCode` in upload response object to be string instead of Int.
- **android** fix upload from content:// URIs
- **android** correct upload response by removing gzip encoding

## [1.0.1]

### 2025-09-01

### Fixes

- **iOS** notify of upload progress


## [1.0.0]

### 2025-05-26

- Feat: Implement plugin methods: `downloadFile`, `uploadFile`, `addListener`, `removeAllListeners`.
