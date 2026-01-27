import { DownloadFileResult, FileTransferError, ProgressStatus, UploadFileResult } from "../../cordova-plugin/src/definitions";
import * as OSFileTransferLibJS from "./pwa";

// Import the FilePlugin
declare const OSFilePluginWrapper: { Instance: any };

class OSFileTransferWrapper {
    private listenersCount = 0;

    downloadFile(options: any, scope: any): void {
        let fileName = options.path.split('/').pop();

        if (this.isPWA()) {
          OSFileTransferLibJS.downloadWithHeaders(options.url, options.headers, fileName);
          return;
        }

        if (scope) {
          this.listenersCount++;
          const downloadSuccess = (res: DownloadFileResult) => {
            if (this.isFilePluginAvailable() && res.path) {
              const statSuccess = (fileInfo: any) => {
                this.handleBasicFileInfo(scope, res.path, fileInfo.name);
              };

              OSFilePluginWrapper.Instance.stat(
                statSuccess,
                () => this.handleBasicFileInfo(scope, res.path),
                { path: res.path }
              );
            } else {
              this.handleBasicFileInfo(scope, res.path);
            }
          };

          const downloadError = (err: FileTransferError) => {
            if (scope.downloadCallback && scope.downloadCallback.downloadError) {
              scope.downloadCallback.downloadError(this.convertError(err));
            }
            this.handleTransferFinished();
          };

          const progressCallback = (progress: ProgressStatus) => {
            if (scope.downloadCallback && scope.downloadCallback.downloadProgress) {
              const progressEvent = {
                loaded: progress.bytes,
                total: progress.contentLength,
                    lengthComputable: progress.lengthComputable
              };
              scope.downloadCallback.downloadProgress(progressEvent);
            }
          };

          if (this.isCordovaPluginDefined()) {
            // @ts-ignore
            cordova.plugins.FileTransfer.addListener('progress', progressCallback);
            // @ts-ignore
            cordova.plugins.FileTransfer.downloadFile(options, downloadSuccess, downloadError);
          } else if (this.isCapacitorPluginDefined()) {
            // @ts-ignore
            window.CapacitorPlugins.FileTransfer.addListener('progress', progressCallback);
            // @ts-ignore
            window.CapacitorPlugins.FileTransfer.downloadFile(options)
              .then(downloadSuccess)
              .catch(downloadError);
          }
        } else {
          if (this.isCordovaPluginDefined()) {
            // @ts-ignore
            cordova.plugins.FileTransfer.downloadFile(options);
          } else if (this.isCapacitorPluginDefined()) {
            // @ts-ignore
            window.CapacitorPlugins.FileTransfer.downloadFile(options);
          }
        }
    }
    
    /**
     * Creates a file result object and notifies the download callback with the result.
     */
    private handleBasicFileInfo(scope: any, filePath?: string, fileName?: string): void {
        const fileResult = {
            path: filePath,
            name: fileName || filePath?.split('/').pop() || '',
            isFile: true,
            isDirectory: false,
            fullPath: filePath,
            nativeURL: filePath ? `file://${filePath}` : undefined
        };
        
        if (scope.downloadCallback && scope.downloadCallback.downloadComplete) {
            scope.downloadCallback.downloadComplete(fileResult);
        }
        this.handleTransferFinished();
    }
    
    uploadFile(options: any, scope: any): void {
        if (this.isPWA()) {
          // For PWA, manually retrieve the file and use the web implementation
          fetch(options.url)
                .then(response => response.blob())
                .then(blob => {
                    const file = new File([blob], options.path.split('/').pop() || 'file', { type: options.mimeType || 'application/octet-stream' });
                    OSFileTransferLibJS.uploadWithHeaders(options.url, options.headers, file, options.fileKey || 'file');
            });

          return;
        }

        if (scope) {
          this.listenersCount++;
          const uploadSuccess = (res: UploadFileResult) => {
            if (scope.uploadCallback && scope.uploadCallback.uploadComplete) {
              scope.uploadCallback.uploadComplete(res);
            }
            this.handleTransferFinished();
          };

          const uploadError = (err: FileTransferError) => {
            if (scope.uploadCallback && scope.uploadCallback.uploadError) {
              scope.uploadCallback.uploadError(this.convertError(err));
            }
            this.handleTransferFinished();
          };

          const progressCallback = (progress: ProgressStatus) => {
            if (scope.uploadCallback && scope.uploadCallback.uploadProgress) {
              const progressEvent = {
                loaded: progress.bytes,
                total: progress.contentLength,
                    lengthComputable: progress.lengthComputable
              };
              scope.uploadCallback.uploadProgress(progressEvent);
            }
          };

          if (this.isCordovaPluginDefined()) {
            // @ts-ignore
            cordova.plugins.FileTransfer.addListener('progress', progressCallback);
            // @ts-ignore
            cordova.plugins.FileTransfer.uploadFile(options, uploadSuccess, uploadError);
          } else if (this.isCapacitorPluginDefined()) {
            // @ts-ignore
            window.CapacitorPlugins.FileTransfer.addListener('progress', progressCallback);
            // @ts-ignore
            window.CapacitorPlugins.FileTransfer.uploadFile(options)
              .then(uploadSuccess)
              .catch(uploadError);
          }
        } else {
          if (this.isCordovaPluginDefined()) {
            // @ts-ignore
            cordova.plugins.FileTransfer.uploadFile(options);
          } else if (this.isCapacitorPluginDefined()) {
            // @ts-ignore
            window.CapacitorPlugins.FileTransfer.uploadFile(options);
          }
        }
    }

    private handleTransferFinished(): void {
        this.listenersCount--;
        
        if (this.listenersCount < 0) {
            this.listenersCount = 0;
        }
        else if (this.listenersCount === 0) {
            if (this.isCordovaPluginDefined()) {
                // @ts-ignore
                cordova.plugins.FileTransfer.removeAllListeners();
            } else if (this.isCapacitorPluginDefined()) {
                // @ts-ignore
                window.CapacitorPlugins.FileTransfer.removeAllListeners();
            }
        }
    }

    /**
     * Converts the error with the correct properties that OutSystems expects in FileTransferError structure.
     * This is done here to have the same fields as the old cordova plugin - thus ensuring backwards compatibility.
     * @param error the error coming from the plugin
     * @returns The error with the properties that OutSystems expects
     */
    private convertError(error: any): FileTransferError & { http_status?: number } {
        if (error.data) {
            // for Capacitor - when there is extra data, it is returned in a separate data attribute
            let object = {
                ...error.data,
                http_status: error.data.httpStatus,
            };
            if (typeof(error.data.headers) !== "undefined") {
                // OutSystems expects headers to be a Text
                object.headers = JSON.stringify(error.data.headers);
            }
            return object;
        } else {
            // for Cordova - all properties are in the root error object
            let object = {
                ...error,
                http_status: error.httpStatus,
            };
            if (typeof(error.headers) !== "undefined") {
                // OutSystems expects headers to be a Text
                object.headers = JSON.stringify(error.headers);
            }
            return object
        }
    }
    
    private isPWA(): boolean {
        return !(this.isCapacitorPluginDefined() || this.isCordovaPluginDefined());
    }
    
    private isCapacitorPluginDefined(): boolean {
        // @ts-ignore
        return (typeof(window) !== "undefined" && typeof(window.CapacitorPlugins) !== "undefined" && typeof(window.CapacitorPlugins.FileTransfer) !== "undefined");
    }

    private isCordovaPluginDefined(): boolean {
        // @ts-ignore
        return typeof(cordova) !== "undefined" && typeof(cordova.plugins) !== "undefined" && typeof(cordova.plugins.FileTransfer) !== "undefined";
    }

    /**
     * Checks if the OSFilePluginWrapper is available
     * @returns true if the File Plugin is defined, false otherwise
     */
    private isFilePluginAvailable(): boolean {
        return typeof OSFilePluginWrapper !== 'undefined' && 
               typeof OSFilePluginWrapper.Instance !== 'undefined' &&
               typeof OSFilePluginWrapper.Instance.stat === 'function';
    }
}

export const Instance = new OSFileTransferWrapper();