"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
class FileTransferErrorClass {
  constructor(code, message) {
    this.message = message;
    this.code = code;
  }
  getErrorCode() {
    return `OS-PLUG-FTRF-${this.code.toString().padStart(4, "0")}`;
  }
  getMessage() {
    return this.message;
  }
  toString() {
    return `Error.${this.getErrorCode()}`;
  }
}
const FileTransferError = {
  UPLOAD: new FileTransferErrorClass(1, "Error when uploading."),
  DOWNLOAD: new FileTransferErrorClass(2, "Error when downloading."),
  INVALID_URL: new FileTransferErrorClass(3, "Invalid url.")
};
async function onError(error, request, source, target) {
  let body = "";
  if (request) {
    if (request.responseType == "text" || request.responseType == "") {
      body = request.responseText;
    } else if (request.responseType == "blob" && request.response) {
      body = await request.response.text();
    }
  }
  let requestError = {
    code: error.getErrorCode(),
    message: error.getMessage(),
    source,
    target,
    http_status: request?.status || 0,
    body,
    exception: error.getMessage()
  };
  const onErrorEvent = new CustomEvent("fileTransferError", { detail: { error: requestError } });
  window.dispatchEvent(onErrorEvent);
}
function onDownloadProgress(e) {
  let progress = { total: e.total, loaded: e.loaded, lengthComputable: e.lengthComputable };
  const downloadProgress = new CustomEvent("downloadprogress", { detail: { progress } });
  window.dispatchEvent(downloadProgress);
}
function onDownloadComplete(request, fileName) {
  if (request.readyState !== 4)
    return;
  if (request.status != 200) {
    onError(FileTransferError.DOWNLOAD, request, request.responseURL, fileName || "");
    return;
  }
  let mimeType = request.getResponseHeader("Content-Type");
  let content = request.getResponseHeader("Content-Disposition");
  if (content && content.indexOf("attachment") !== -1) {
    let regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    let matches = regex.exec(content);
    if (matches != null && matches[1]) {
      fileName = matches[1].replace(/['"]/g, "");
    }
  }
  const downloadComplete = new CustomEvent("downloadcomplete", { detail: { result: { isFile: true, name: fileName } } });
  window.dispatchEvent(downloadComplete);
  let blob = new Blob([request.response], { type: mimeType || "application/octet-stream" });
  let a = document.createElement("a");
  a.style.display = "none";
  document.body.appendChild(a);
  let url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName || "download";
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
function onUploadComplete(request, file) {
  if (request.readyState !== 4)
    return;
  if (request.status != 200) {
    onError(FileTransferError.UPLOAD, request, request.responseURL, file.name);
    return;
  }
  let upResult = {
    name: file.name,
    bytesSent: file.size,
    responseCode: request.status
  };
  const uploadComplete = new CustomEvent("uploadcomplete", { detail: { result: upResult } });
  window.dispatchEvent(uploadComplete);
}
function onUploadProgress(e) {
  let progress = { total: e.total, loaded: e.loaded, lengthComputable: e.lengthComputable };
  const uploadProgress = new CustomEvent("uploadprogress", { detail: { progress } });
  window.dispatchEvent(uploadProgress);
}
function download(url, fileName) {
  downloadWithHeaders(url, [], fileName);
}
function downloadWithHeaders(url, headers, fileName) {
  if (url == "") {
    onError(FileTransferError.INVALID_URL, void 0, fileName, url);
    return;
  }
  let request = new XMLHttpRequest();
  request.responseType = "blob";
  request.onload = (_e) => {
    onDownloadComplete(request, fileName);
  };
  request.onprogress = onDownloadProgress;
  request.onerror = (_e) => {
    onError(FileTransferError.DOWNLOAD, request, fileName, url);
  };
  request.open("GET", url);
  if (headers.length > 0) {
    headers.forEach((h) => {
      request.setRequestHeader(h.name, h.value);
    });
  }
  request.send();
}
function upload(url, content, fileKey) {
  uploadWithHeaders(url, [], content, fileKey);
}
function uploadWithHeaders(url, headers, content, fileKey = "file") {
  if (url == "") {
    onError(FileTransferError.INVALID_URL, void 0, content.name, url);
    return;
  }
  let request = new XMLHttpRequest();
  let data;
  request.upload.onprogress = onUploadProgress;
  request.onload = (_e) => {
    onUploadComplete(request, content);
  };
  request.upload.onerror = (_e) => {
    onError(FileTransferError.UPLOAD, request, content.name, url);
  };
  request.open("POST", url);
  if (headers.length > 0) {
    headers.forEach((h) => {
      request.setRequestHeader(h.name, h.value);
    });
  }
  data = new FormData();
  data.append(fileKey, content);
  request.send(data);
}
class OSFileTransferWrapper {
  constructor() {
    this.listenersCount = 0;
  }
  downloadFile(options, scope) {
    if (this.isPWA()) {
      download(options.url, options.path.split("/").pop());
      if (scope) {
        const downloadProgressListener = (event) => {
          if (scope.downloadCallback && scope.downloadCallback.downloadProgress) {
            const progressData = event.detail.progress;
            const status = {
              type: "download",
              url: options.url,
              bytes: progressData.loaded,
              contentLength: progressData.total,
              lengthComputable: progressData.lengthComputable
            };
            scope.downloadCallback.downloadProgress(status);
          }
        };
        const downloadCompleteListener = (event) => {
          if (scope.downloadCallback && scope.downloadCallback.downloadComplete) {
            const result = event.detail.result;
            scope.downloadCallback.downloadComplete({
              path: options.path,
              name: result.name,
              isFile: result.isFile
            });
          }
          window.removeEventListener("downloadprogress", downloadProgressListener);
          window.removeEventListener("downloadcomplete", downloadCompleteListener);
          window.removeEventListener("fileTransferError", downloadErrorListener);
        };
        const downloadErrorListener = (event) => {
          if (scope.downloadCallback && scope.downloadCallback.downloadError) {
            scope.downloadCallback.downloadError(event.detail.error);
          }
          window.removeEventListener("downloadprogress", downloadProgressListener);
          window.removeEventListener("downloadcomplete", downloadCompleteListener);
          window.removeEventListener("fileTransferError", downloadErrorListener);
        };
        window.addEventListener("downloadprogress", downloadProgressListener);
        window.addEventListener("downloadcomplete", downloadCompleteListener);
        window.addEventListener("fileTransferError", downloadErrorListener);
      }
      return;
    }
    if (!scope) {
      return;
    }
    this.listenersCount++;
    const downloadSuccess = (res) => {
      if (scope.downloadCallback && scope.downloadCallback.downloadComplete) {
        scope.downloadCallback.downloadComplete({
          path: res.path,
          name: res.path?.split("/").pop() || "",
          isFile: true
        });
      }
      this.handleTransferFinished();
    };
    const downloadError = (err) => {
      if (scope.downloadCallback && scope.downloadCallback.downloadError) {
        scope.downloadCallback.downloadError(err);
      }
      this.handleTransferFinished();
    };
    const progressCallback = (progress) => {
      if (scope.downloadCallback && scope.downloadCallback.downloadProgress) {
        scope.downloadCallback.downloadProgress(progress);
      }
    };
    if (this.isSynapseDefined()) {
      CapacitorUtils.Synapse.FileTransfer.addListener("progress", progressCallback);
      CapacitorUtils.Synapse.FileTransfer.downloadFile(options, downloadSuccess, downloadError);
    } else if (this.isCapacitorPluginDefined()) {
      Capacitor.Plugins.FileTransfer.addListener("progress", progressCallback);
      Capacitor.Plugins.FileTransfer.downloadFile(options).then(downloadSuccess).catch(downloadError);
    }
  }
  uploadFile(options, scope) {
    if (this.isPWA()) {
      fetch(options.path).then((response) => response.blob()).then((blob) => {
        const file = new File([blob], options.path.split("/").pop() || "file", { type: options.mimeType || "application/octet-stream" });
        upload(options.url, file, options.fileKey || "file");
        if (scope) {
          const uploadProgressListener = (event) => {
            if (scope.uploadCallback && scope.uploadCallback.uploadProgress) {
              const progressData = event.detail.progress;
              const status = {
                type: "upload",
                url: options.url,
                bytes: progressData.loaded,
                contentLength: progressData.total,
                lengthComputable: progressData.lengthComputable
              };
              scope.uploadCallback.uploadProgress(status);
            }
          };
          const uploadCompleteListener = (event) => {
            if (scope.uploadCallback && scope.uploadCallback.uploadComplete) {
              const result = event.detail.result;
              scope.uploadCallback.uploadComplete({
                bytesSent: result.bytesSent,
                responseCode: result.responseCode,
                response: result.response || ""
              });
            }
            window.removeEventListener("uploadprogress", uploadProgressListener);
            window.removeEventListener("uploadcomplete", uploadCompleteListener);
            window.removeEventListener("fileTransferError", uploadErrorListener);
          };
          const uploadErrorListener = (event) => {
            if (scope.uploadCallback && scope.uploadCallback.uploadError) {
              scope.uploadCallback.uploadError(event.detail.error);
            }
            window.removeEventListener("uploadprogress", uploadProgressListener);
            window.removeEventListener("uploadcomplete", uploadCompleteListener);
            window.removeEventListener("fileTransferError", uploadErrorListener);
          };
          window.addEventListener("uploadprogress", uploadProgressListener);
          window.addEventListener("uploadcomplete", uploadCompleteListener);
          window.addEventListener("fileTransferError", uploadErrorListener);
        }
      });
      return;
    }
    if (!scope) {
      return;
    }
    this.listenersCount++;
    const uploadSuccess = (res) => {
      if (scope.uploadCallback && scope.uploadCallback.uploadComplete) {
        scope.uploadCallback.uploadComplete(res);
      }
      this.handleTransferFinished();
    };
    const uploadError = (err) => {
      if (scope.uploadCallback && scope.uploadCallback.uploadError) {
        scope.uploadCallback.uploadError(err);
      }
      this.handleTransferFinished();
    };
    const progressCallback = (progress) => {
      if (scope.uploadCallback && scope.uploadCallback.uploadProgress) {
        scope.uploadCallback.uploadProgress(progress);
      }
    };
    if (this.isSynapseDefined()) {
      CapacitorUtils.Synapse.FileTransfer.addListener("progress", progressCallback);
      CapacitorUtils.Synapse.FileTransfer.uploadFile(options, uploadSuccess, uploadError);
    } else if (this.isCapacitorPluginDefined()) {
      Capacitor.Plugins.FileTransfer.addListener("progress", progressCallback);
      Capacitor.Plugins.FileTransfer.uploadFile(options).then(uploadSuccess).catch(uploadError);
    }
  }
  handleTransferFinished() {
    this.listenersCount--;
    if (this.listenersCount < 0) {
      this.listenersCount = 0;
    } else if (this.listenersCount === 0) {
      if (this.isSynapseDefined()) {
        CapacitorUtils.Synapse.FileTransfer.removeAllListeners();
      } else if (this.isCapacitorPluginDefined()) {
        Capacitor.Plugins.FileTransfer.removeAllListeners();
      }
    }
  }
  isPWA() {
    if (this.isSynapseDefined()) {
      return false;
    }
    if (this.isCapacitorPluginDefined()) {
      return false;
    }
    return true;
  }
  isCapacitorPluginDefined() {
    return typeof Capacitor !== "undefined" && typeof Capacitor.Plugins !== "undefined" && typeof Capacitor.Plugins.FileTransfer !== "undefined";
  }
  /**
   * Check that is required because MABS 12 isnt installing synapse dependency for capacitor plugins.
   * Once MABS 12 no longer has that limitation, this can be removed.
   * @returns true if synapse is defined, false otherwise
   */
  isSynapseDefined() {
    return typeof CapacitorUtils !== "undefined" && typeof CapacitorUtils.Synapse !== "undefined" && typeof CapacitorUtils.Synapse.FileTransfer !== "undefined";
  }
}
const Instance = new OSFileTransferWrapper();
exports.Instance = Instance;
