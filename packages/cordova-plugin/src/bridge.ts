import { DownloadFileOptions, DownloadFileResult, FileTransferError, ProgressStatus, UploadFileOptions, UploadFileResult } from "./definitions";

// @ts-ignore
const exec = require('cordova/exec');

function downloadFile(options: DownloadFileOptions, success: (output: DownloadFileResult) => void, error: (error: FileTransferError) => void): void {
  exec(success, error, 'OSFileTransferPlugin', 'downloadFile', [options]);
}

function uploadFile(options: UploadFileOptions, success: (output: UploadFileResult) => void, error: (error: FileTransferError) => void): void {
  exec(success, error, 'OSFileTransferPlugin', 'uploadFile', [options]);
}

function addListener(eventName: 'progress', listenerFunc: (progress: ProgressStatus) => void): void {
  exec(listenerFunc, emptyListener, "OSFileTransferPlugin", "addListener", [eventName]);
}

function removeAllListeners(): void {
  exec(emptyListener, emptyListener, "OSFileTransferPlugin", "removeAllListeners", []);
}

function emptyListener(_: any): void {
  return;
}

// @ts-ignore
module.exports = {
  downloadFile,
  uploadFile,
  addListener,
  removeAllListeners
};