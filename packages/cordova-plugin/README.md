# FileTransferPlugin - Cordova

*This plugin is SUPPORTED by OutSystems. Customers entitled to Support Services may obtain assistance through Support.*

This plugin is only available in Native Android and iOS; not available for Web / PWAs.

## Installation

```console
cordova plugin add <path-to-repo-local-clone>
```

## API

<docgen-index>

* [`downloadFile(...)`](#downloadfile)
* [`uploadFile(...)`](#uploadfile)
* [`addListener('progress', ...)`](#addlistenerprogress-)
* [`removeAllListeners()`](#removealllisteners)
* [Interfaces](#interfaces)

</docgen-index>


<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

File Transfer API

Only available in Native Android and iOS; not available for Web / PWAs.

### downloadFile(...)

```typescript
downloadFile(options: DownloadFileOptions) => Promise<DownloadFileResult>
```

Perform an HTTP request to a server and download the file to the specified destination.

| Param         | Type                                                                |
| ------------- | ------------------------------------------------------------------- |
| **`options`** | <code><a href="#downloadfileoptions">DownloadFileOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#downloadfileresult">DownloadFileResult</a>&gt;</code>

**Since:** 1.0.0

--------------------


### uploadFile(...)

```typescript
uploadFile(options: UploadFileOptions) => Promise<UploadFileResult>
```

Perform an HTTP request to upload a file to a server

| Param         | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| **`options`** | <code><a href="#uploadfileoptions">UploadFileOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#uploadfileresult">UploadFileResult</a>&gt;</code>

**Since:** 1.0.0

--------------------


### addListener('progress', ...)

```typescript
addListener(eventName: "progress", listenerFunc: (progress: ProgressStatus) => void) => Promise<void>
```

Add a listener to file transfer (download or upload) progress events.

| Param              | Type                                                                             |
| ------------------ | -------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'progress'</code>                                                          |
| **`listenerFunc`** | <code>(progress: <a href="#progressstatus">ProgressStatus</a>) =&gt; void</code> |

**Since:** 1.0.0

--------------------


### removeAllListeners()

```typescript
removeAllListeners() => Promise<void>
```

Remove all listeners for this plugin.

**Since:** 1.0.0

--------------------


### Interfaces


#### DownloadFileResult

| Prop       | Type                | Description                          | Since |
| ---------- | ------------------- | ------------------------------------ | ----- |
| **`path`** | <code>string</code> | The path the file was downloaded to. | 1.0.0 |


#### DownloadFileOptions

| Prop           | Type                 | Description                                                                                                                                                                        | Since |
| -------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **`path`**     | <code>string</code>  | The full file path the downloaded file should be moved to.                                                                                                                         | 1.0.0 |
| **`progress`** | <code>boolean</code> | If true, progress event will be dispatched on every chunk received. See addListener() for more information. Chunks are throttled to every 100ms on Android/iOS to avoid slowdowns. | 1.0.0 |


#### UploadFileResult

| Prop               | Type                                    | Description                                            | Since |
| ------------------ | --------------------------------------- | ------------------------------------------------------ | ----- |
| **`bytesSent`**    | <code>number</code>                     | Total number of bytes uploaded                         | 1.0.0 |
| **`responseCode`** | <code>string</code>                     | HTTP response code for the upload                      | 1.0.0 |
| **`response`**     | <code>string</code>                     | HTTP response body from the upload (when available)    | 1.0.0 |
| **`headers`**      | <code>{ [key: string]: string; }</code> | HTTP headers from the upload response (when available) | 1.0.0 |


#### UploadFileOptions

| Prop              | Type                 | Description                                                                                                                                                                        | Since |
| ----------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **`path`**        | <code>string</code>  | Full file path of the file to upload.                                                                                                                                              | 1.0.0 |
| **`chunkedMode`** | <code>boolean</code> | Whether to upload data in a chunked streaming mode.                                                                                                                                | 1.0.0 |
| **`mimeType`**    | <code>string</code>  | Mime type of the data to upload. Only used if "Content-Type" header was not provided.                                                                                              | 1.0.0 |
| **`fileKey`**     | <code>string</code>  | Type of form element. The default is set to "file". Only used if "Content-Type" header was not provided.                                                                           | 1.0.0 |
| **`progress`**    | <code>boolean</code> | If true, progress event will be dispatched on every chunk received. See addListener() for more information. Chunks are throttled to every 100ms on Android/iOS to avoid slowdowns. | 1.0.0 |


#### ProgressStatus

| Prop                   | Type                                | Description                                                                                                                         | Since |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **`type`**             | <code>'download' \| 'upload'</code> | The type of transfer operation (download or upload).                                                                                | 1.0.0 |
| **`url`**              | <code>string</code>                 | The url of the file associated with the transfer (download or upload).                                                              | 1.0.0 |
| **`bytes`**            | <code>number</code>                 | The number of bytes transferred so far.                                                                                             | 1.0.0 |
| **`contentLength`**    | <code>number</code>                 | The total number of bytes associated with the file transfer.                                                                        | 1.0.0 |
| **`lengthComputable`** | <code>boolean</code>                | Whether or not the contentLength value is relevant. In some situations, the total number of bytes may not be possible to determine. | 1.0.0 |

</docgen-api>