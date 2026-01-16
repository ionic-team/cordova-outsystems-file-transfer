# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
