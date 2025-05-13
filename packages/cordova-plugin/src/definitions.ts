export interface HttpHeaders {
    /**
     * A key/value dictionary of Http headers.
     */
    [key: string]: string;
}

export interface HttpParams {
    /**
     * A key/value dictionary of URL parameters to set.
     */
    [key: string]: string | string[];
}

export interface HttpOptions {
    /**
     * The URL to send the request to.
     */
    url: string;
    /**
     * The Http Request method to run. (Default is GET)
     */
    method?: string;
    /**
     * URL parameters to append to the request.
     */
    params?: HttpParams;
    /**
     * Http Request headers to send with the request.
     */
    headers?: HttpHeaders;
    /**
     * How long to wait to read additional data in milliseconds.
     * Resets each time new data is received.
     */
    readTimeout?: number;
    /**
     * How long to wait for the initial connection in milliseconds.
     */
    connectTimeout?: number;
    /**
     * Sets whether automatic HTTP redirects should be disabled
     */
    disableRedirects?: boolean;
    /**
     * Use this option if you need to keep the URL unencoded in certain cases
     * (already encoded, azure/firebase testing, etc.). The default is _true_.
     * This option is not available in iOS - It is always _true_.
     */
    shouldEncodeUrlParams?: boolean;
}

export interface DownloadFileOptions extends HttpOptions {
    /**
     * The full file path the downloaded file should be moved to.
     * @since 1.0.0
     */
    path: string;
    /**
     * If true, progress event will be dispatched on every chunk received.
     * See addListener() for more information.
     * Chunks are throttled to every 100ms on Android/iOS to avoid slowdowns.
     * @since 1.0.0
     */
    progress?: boolean;
}

export interface DownloadFileResult {
    /**
     * The path the file was downloaded to.
     * @since 1.0.0
     */
    path?: string;
}

export interface UploadFileOptions extends HttpOptions {
    /**
     * Full file path of the file to upload.
     * @since 1.0.0
     */
    path: string;
    /**
     * Whether to upload data in a chunked streaming mode.
     * @since 1.0.0
     */
    chunkedMode?: boolean;
    /**
     * Mime type of the data to upload.
     * Only used if "Content-Type" header was not provided.
     * @since 1.0.0
     */
    mimeType?: string;
    /**
     * Type of form element. The default is set to "file".
     * Only used if "Content-Type" header was not provided.
     * @since 1.0.0
     */
    fileKey?: string;
    /**
     * If true, progress event will be dispatched on every chunk received.
     * See addListener() for more information.
     * Chunks are throttled to every 100ms on Android/iOS to avoid slowdowns.
     * @since 1.0.0
     */
    progress?: boolean;
}

export interface UploadFileResult {
    /**
     * Total number of bytes uploaded
     * @since 1.0.0
     */
    bytesSent: number;
    /**
     * HTTP response code for the upload
     * @since 1.0.0
     */
    responseCode: string;
    /**
     * HTTP response body from the upload (when available)
     * @since 1.0.0
     */
    response?: string;
    /**
     * HTTP headers from the upload response (when available)
     * @since 1.0.0
     */
    headers?: { [key: string]: string };
}

export interface ProgressStatus {
    /**
     * The type of transfer operation (download or upload).
     * @since 1.0.0
     */
    type: "download" | "upload";
    /**
     * The url of the file associated with the transfer (download or upload).
     * @since 1.0.0
     */
    url: string;
    /**
     * The number of bytes transferred so far.
     * @since 1.0.0
     */
    bytes: number;
    /**
     * The total number of bytes associated with the file transfer.
     * @since 1.0.0
     */
    contentLength: number;
    /**
     * Whether or not the contentLength value is relevant.
     * In some situations, the total number of bytes may not be possible to determine.
     * @since 1.0.0
     */
    lengthComputable: boolean;
}

export interface FileTransferError {
    /**
     * Code identifying the error: OS-PLUG-FLTR-XXXX
     * @since 1.0.0
     */
    code: string;
    /**
     * Message informing of what went wrong
     * @since 1.0.0
     */
    message: string;
    /**
     * The source for the file transfer operation (a url for download, a file path for upload)
     * @since 1.0.0
     */
    source?: string;
    /**
     * The target of the file transfer operation (a file path for download, a url for upload)
     * @since 1.0.0
     */
    target?: string;
    /**
     * HTTP status code of the server response (if available)
     * @since 1.0.0
     */
    httpStatus?: number;
    /**
     * HTTP error response body from the server (if available)
     * @since 1.0.0
     */
    body?: string;
    /**
     * Exception message thrown on native side (if available)
     * @since 1.0.0
     */
    exception?: string;
}

/**
 * File Transfer API
 * 
 * Only available in Native Android and iOS; not available for Web / PWAs.
 */
export interface IFileTransfer {
    /**
     * Perform an HTTP request to a server and download the file to the specified destination.
     * @since 1.0.0
     */
    downloadFile(options: DownloadFileOptions): Promise<DownloadFileResult>;
    
    /**
     * Perform an HTTP request to upload a file to a server
     * @since 1.0.0
     */
    uploadFile(options: UploadFileOptions): Promise<UploadFileResult>;
    
    /**
     * Add a listener to file transfer (download or upload) progress events.
     * @since 1.0.0
     */
    addListener(
        eventName: "progress",
        listenerFunc: (progress: ProgressStatus) => void,
    ): Promise<void>;
    
    /**
     * Remove all listeners for this plugin.
     * @since 1.0.0
     */
    removeAllListeners(): Promise<void>;
}