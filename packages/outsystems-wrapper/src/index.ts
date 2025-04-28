import { DownloadFileOptions, DownloadFileResult, FileTransferError, ProgressStatus, UploadFileOptions, UploadFileResult } from "../../cordova-plugin/src/definitions";
import * as OSFileTransferLibJS from "./pwa";

class OSFileTransferWrapper {
    private listenersCount = 0;

    downloadFile(options: DownloadFileOptions, scope: any): void {
        if (this.isPWA()) {
            // For PWA, use the web implementation with browser events
            OSFileTransferLibJS.download(options.url, options.path.split('/').pop());
            
            // Set up event listeners for PWA
            if (scope) {
                const downloadProgressListener = (event: any) => {
                    if (scope.downloadCallback && scope.downloadCallback.downloadProgress) {
                        const progressData = event.detail.progress;
                        const status: ProgressStatus = {
                            type: "download",
                            url: options.url,
                            bytes: progressData.loaded,
                            contentLength: progressData.total,
                            lengthComputable: progressData.lengthComputable
                        };
                        scope.downloadCallback.downloadProgress(status);
                    }
                };
                
                const downloadCompleteListener = (event: any) => {
                    if (scope.downloadCallback && scope.downloadCallback.downloadComplete) {
                        const result = event.detail.result;
                        scope.downloadCallback.downloadComplete({
                            path: options.path,
                            name: result.name,
                            isFile: result.isFile
                        });
                    }
                    window.removeEventListener('downloadprogress', downloadProgressListener);
                    window.removeEventListener('downloadcomplete', downloadCompleteListener);
                    window.removeEventListener('fileTransferError', downloadErrorListener);
                };
                
                const downloadErrorListener = (event: any) => {
                    if (scope.downloadCallback && scope.downloadCallback.downloadError) {
                        scope.downloadCallback.downloadError(event.detail.error);
                    }
                    window.removeEventListener('downloadprogress', downloadProgressListener);
                    window.removeEventListener('downloadcomplete', downloadCompleteListener);
                    window.removeEventListener('fileTransferError', downloadErrorListener);
                };
                
                window.addEventListener('downloadprogress', downloadProgressListener);
                window.addEventListener('downloadcomplete', downloadCompleteListener);
                window.addEventListener('fileTransferError', downloadErrorListener);
            }
            
            return;
        }
        
        if (!scope) {
            return;
        }
        
        this.listenersCount++;
        
        const downloadSuccess = (res: DownloadFileResult) => {
            if (scope.downloadCallback && scope.downloadCallback.downloadComplete) {
                // In a real implementation, you might want to call FilePlugin's getMetadata/stat for native
                // and use that to create the `FileDownloadResult` structure that Outsystems expects
                scope.downloadCallback.downloadComplete({
                    path: res.path,
                    name: res.path?.split('/').pop() || '',
                    isFile: true
                });
            }
            this.handleTransferFinished();
        };
        
        const downloadError = (err: FileTransferError) => {
            if (scope.downloadCallback && scope.downloadCallback.downloadError) {
                scope.downloadCallback.downloadError(err);
            }
            this.handleTransferFinished();
        };
        
        const progressCallback = (progress: ProgressStatus) => {
            if (scope.downloadCallback && scope.downloadCallback.downloadProgress) {
                scope.downloadCallback.downloadProgress(progress);
            }
        };
        
        if (this.isSynapseDefined()) {
            // @ts-ignore - For MABS with Synapse
            CapacitorUtils.Synapse.FileTransfer.addListener('progress', progressCallback);
            // @ts-ignore
            CapacitorUtils.Synapse.FileTransfer.downloadFile(options, downloadSuccess, downloadError);
        } else if (this.isCapacitorPluginDefined()) {
            // @ts-ignore - For Capacitor without Synapse (e.g., MABS 12)
            Capacitor.Plugins.FileTransfer.addListener('progress', progressCallback);
            // @ts-ignore
            Capacitor.Plugins.FileTransfer.downloadFile(options)
                .then(downloadSuccess)
                .catch(downloadError);
        }
    }
    
    uploadFile(options: UploadFileOptions, scope: any): void {
        if (this.isPWA()) {
            // For PWA, manually retrieve the file and use the web implementation
            fetch(options.path)
                .then(response => response.blob())
                .then(blob => {
                    const file = new File([blob], options.path.split('/').pop() || 'file', { type: options.mimeType || 'application/octet-stream' });
                    OSFileTransferLibJS.upload(options.url, file, options.fileKey || 'file');
                    
                    // Set up event listeners for PWA
                    if (scope) {
                        const uploadProgressListener = (event: any) => {
                            if (scope.uploadCallback && scope.uploadCallback.uploadProgress) {
                                const progressData = event.detail.progress;
                                const status: ProgressStatus = {
                                    type: "upload",
                                    url: options.url,
                                    bytes: progressData.loaded,
                                    contentLength: progressData.total,
                                    lengthComputable: progressData.lengthComputable
                                };
                                scope.uploadCallback.uploadProgress(status);
                            }
                        };
                        
                        const uploadCompleteListener = (event: any) => {
                            if (scope.uploadCallback && scope.uploadCallback.uploadComplete) {
                                const result = event.detail.result;
                                scope.uploadCallback.uploadComplete({
                                    bytesSent: result.bytesSent,
                                    responseCode: result.responseCode,
                                    response: result.response || ''
                                });
                            }
                            window.removeEventListener('uploadprogress', uploadProgressListener);
                            window.removeEventListener('uploadcomplete', uploadCompleteListener);
                            window.removeEventListener('fileTransferError', uploadErrorListener);
                        };
                        
                        const uploadErrorListener = (event: any) => {
                            if (scope.uploadCallback && scope.uploadCallback.uploadError) {
                                scope.uploadCallback.uploadError(event.detail.error);
                            }
                            window.removeEventListener('uploadprogress', uploadProgressListener);
                            window.removeEventListener('uploadcomplete', uploadCompleteListener);
                            window.removeEventListener('fileTransferError', uploadErrorListener);
                        };
                        
                        window.addEventListener('uploadprogress', uploadProgressListener);
                        window.addEventListener('uploadcomplete', uploadCompleteListener);
                        window.addEventListener('fileTransferError', uploadErrorListener);
                    }
                });
            
            return;
        }
        
        if (!scope) {
            return;
        }
        
        this.listenersCount++;
        
        const uploadSuccess = (res: UploadFileResult) => {
            if (scope.uploadCallback && scope.uploadCallback.uploadComplete) {
                scope.uploadCallback.uploadComplete(res);
            }
            this.handleTransferFinished();
        };
        
        const uploadError = (err: FileTransferError) => {
            if (scope.uploadCallback && scope.uploadCallback.uploadError) {
                scope.uploadCallback.uploadError(err);
            }
            this.handleTransferFinished();
        };
        
        const progressCallback = (progress: ProgressStatus) => {
            if (scope.uploadCallback && scope.uploadCallback.uploadProgress) {
                scope.uploadCallback.uploadProgress(progress);
            }
        };
        
        if (this.isSynapseDefined()) {
            // @ts-ignore - For MABS with Synapse
            CapacitorUtils.Synapse.FileTransfer.addListener('progress', progressCallback);
            // @ts-ignore
            CapacitorUtils.Synapse.FileTransfer.uploadFile(options, uploadSuccess, uploadError);
        } else if (this.isCapacitorPluginDefined()) {
            // @ts-ignore - For Capacitor without Synapse (e.g., MABS 12)
            Capacitor.Plugins.FileTransfer.addListener('progress', progressCallback);
            // @ts-ignore
            Capacitor.Plugins.FileTransfer.uploadFile(options)
                .then(uploadSuccess)
                .catch(uploadError);
        }
    }
    
    private handleTransferFinished(): void {
        this.listenersCount--;
        
        if (this.listenersCount < 0) {
            this.listenersCount = 0;
        }
        else if (this.listenersCount === 0) {
            if (this.isSynapseDefined()) {
                // @ts-ignore
                CapacitorUtils.Synapse.FileTransfer.removeAllListeners();
            } else if (this.isCapacitorPluginDefined()) {
                // @ts-ignore
                Capacitor.Plugins.FileTransfer.removeAllListeners();
            }
        }
    }
    
    private isPWA(): boolean {
        if (this.isSynapseDefined()) {
            // Synapse defined <-> native mobile app <-> should use cordova web implementation
            return false;
        }
        if (this.isCapacitorPluginDefined()) {
            // Capacitor plugin defined, so it means we have:
            // - a native mobile app where capacitor plugin comes without Synapse (MABS 12 issue) -> use capacitor plugin
            return false;
        }
        return true;
    }
    
    private isCapacitorPluginDefined(): boolean {
        // @ts-ignore
        return (typeof(Capacitor) !== "undefined" && typeof(Capacitor.Plugins) !== "undefined" && typeof(Capacitor.Plugins.FileTransfer) !== "undefined");
    }

    /**
     * Check that is required because MABS 12 isnt installing synapse dependency for capacitor plugins.
     * Once MABS 12 no longer has that limitation, this can be removed.
     * @returns true if synapse is defined, false otherwise
     */
    private isSynapseDefined(): boolean {
        // @ts-ignore
        return typeof(CapacitorUtils) !== "undefined" && typeof(CapacitorUtils.Synapse) !== "undefined" && typeof(CapacitorUtils.Synapse.FileTransfer) !== "undefined";
    }
}

export const Instance = new OSFileTransferWrapper();