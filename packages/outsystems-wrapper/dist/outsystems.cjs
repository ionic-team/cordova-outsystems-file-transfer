"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
class FileTransferErrorClass {
  constructor(code, message) {
    this.message = message;
    this.code = code;
  }
  getErrorCode() {
    return `OS-PLUG-FLTR-${this.code.toString().padStart(4, "0")}`;
  }
  getMessage() {
    return this.message;
  }
  toString() {
    return `Error.${this.getErrorCode()}`;
  }
}
const FileTransferError = {
  UPLOAD: new FileTransferErrorClass(10, "HTTP error when uploading."),
  DOWNLOAD: new FileTransferErrorClass(10, "HTTP error when downloading."),
  INVALID_URL: new FileTransferErrorClass(5, "Invalid server URL."),
  CONNECTION_ERR: new FileTransferErrorClass(8, "Failed to connect to server.")
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
  let message = error.getMessage();
  if (request && request.status >= 400 && (error === FileTransferError.UPLOAD || error === FileTransferError.DOWNLOAD)) {
    message = `HTTP error: ${request.status} - ${request.statusText || "Unknown error"}`;
  }
  let requestError = {
    code: error.getErrorCode(),
    message,
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
  if (request.status < 200 || request.status >= 300) {
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
  if (request.status < 200 || request.status >= 300) {
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
    onError(FileTransferError.CONNECTION_ERR, request, fileName, url);
  };
  request.open("GET", url);
  if (headers.length > 0) {
    headers.forEach((h) => {
      request.setRequestHeader(h.name, h.value);
    });
  }
  request.send();
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
    onError(FileTransferError.CONNECTION_ERR, request, content.name, url);
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
      downloadWithHeaders(options.url, options.headers, options.fileName);
      return;
    }
    if (!scope) {
      return;
    }
    this.listenersCount++;
    const downloadSuccess = (res) => {
      if (this.isFilePluginAvailable() && res.path) {
        const statSuccess = (fileInfo) => {
          this.completeDownload(scope, {
            path: res.path,
            name: fileInfo.name || res.path?.split("/").pop() || "",
            size: fileInfo.size,
            type: fileInfo.type,
            mtime: fileInfo.mtime,
            ctime: fileInfo.ctime,
            isFile: true
          });
        };
        const statError = () => {
          this.completeDownload(scope, {
            path: res.path,
            name: res.path?.split("/").pop() || "",
            isFile: true
          });
        };
        OSFilePluginWrapper.Instance.stat(
          statSuccess,
          statError,
          { path: res.path }
        );
      } else {
        this.completeDownload(scope, {
          path: res.path,
          name: res.path?.split("/").pop() || "",
          isFile: true
        });
      }
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
  /**
   * Helper method to complete the download operation and notify the callback
   */
  completeDownload(scope, result) {
    if (scope.downloadCallback && scope.downloadCallback.downloadComplete) {
      scope.downloadCallback.downloadComplete(result);
    }
    this.handleTransferFinished();
  }
  uploadFile(options, scope) {
    if (this.isPWA()) {
      fetch(options.path).then((response) => response.blob()).then((blob) => {
        const file = new File([blob], options.path.split("/").pop() || "file", { type: options.mimeType || "application/octet-stream" });
        uploadWithHeaders(options.url, options.headers, file, options.fileKey || "file");
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
  /**
   * Checks if the OSFilePluginWrapper is available
   * @returns true if the File Plugin is defined, false otherwise
   */
  isFilePluginAvailable() {
    return typeof OSFilePluginWrapper !== "undefined" && typeof OSFilePluginWrapper.Instance !== "undefined" && typeof OSFilePluginWrapper.Instance.stat === "function";
  }
}
const Instance = new OSFileTransferWrapper();
exports.Instance = Instance;
