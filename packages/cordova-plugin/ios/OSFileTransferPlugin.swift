import Foundation
import Combine
import Capacitor
import IONFileTransferLib

private enum Action: String {
    case download
    case upload
}

/// A Capacitor plugin that enables file upload and download using the IONFileTransferLib.
///
/// This plugin provides two main JavaScript-exposed methods: `uploadFile` and `downloadFile`.
/// Internally, it uses Combine to observe progress and results, and bridges data using CAPPluginCall.
@objc(OSFileTransferPlugin)
class OSFileTransferPlugin : CDVPlugin {
    private lazy var manager = IONFLTRManager()
    private var listeners: [CDVInvokedUrlCommand] = []
    private var lastProgressUpdate: TimeInterval = 0
    private let progressUpdateInterval: TimeInterval = 0.1 // 100ms
    
    // MARK: - Public API Methods
    
    @objc(downloadFile:)
    func downloadFile(command: CDVInvokedUrlCommand) {
        do {
            let options = try parseDownloadOptions(command)
            
            try manager.downloadFile(
                fromServerURL: options.serverURL,
                toFileURL: options.fileURL,
                withHttpOptions: options.httpOptions
            ).sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.sendError(command, error.toFileTransferError())
                    }
                },
                receiveValue: { [weak self] result in
                    guard let self = self else { return }
                    
                    switch result {
                    case .ongoing(let status):
                        if options.shouldTrackProgress {
                            self.notifyProgress("download", options.serverURL.absoluteString, status)
                        }
                        
                    case .complete:
                        // Send a final progress update with 100% completion
                        if options.shouldTrackProgress {
                            let contentLength = result.data.totalBytes
                            let finalStatus = IONFLTRProgressStatus(
                                bytes: contentLength,
                                contentLength: contentLength,
                                lengthComputable: true
                            )
                            self.notifyProgress("download", options.serverURL.absoluteString, finalStatus, forceUpdate: true)
                        }
                        
                        let result: [String: Any] = [
                            "path": options.fileURL.path
                        ]
                        self.sendSuccess(command, result)
                    }
                }
            ).store(in: &cancellables)
        } catch {
            sendError(command, error.toFileTransferError())
        }
    }
    
    @objc(uploadFile:)
    func uploadFile(command: CDVInvokedUrlCommand) {
        do {
            let options = try parseUploadOptions(command)
            
            try manager.uploadFile(
                fromFileURL: options.fileURL,
                toServerURL: options.serverURL,
                withUploadOptions: options.uploadOptions,
                andHttpOptions: options.httpOptions
            ).sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.sendError(command, error.toFileTransferError())
                    }
                },
                receiveValue: { [weak self] result in
                    guard let self = self else { return }
                    
                    switch result {
                    case .ongoing(let status):
                        if options.shouldTrackProgress {
                            self.notifyProgress("upload", options.serverURL.absoluteString, status)
                        }
                        
                    case .complete:
                        // Send a final progress update with 100% completion
                        if options.shouldTrackProgress {
                            let contentLength = result.data.totalBytes
                            let finalStatus = IONFLTRProgressStatus(
                                bytes: contentLength,
                                contentLength: contentLength,
                                lengthComputable: true
                            )
                            self.notifyProgress("upload", options.serverURL.absoluteString, finalStatus, forceUpdate: true)
                        }
                        
                        let headersDict = result.data.headers.reduce(into: [String: String]()) { result, entry in
                            result[entry.key] = entry.value.first
                        }
                        
                        let uploadResult: [String: Any] = [
                            "bytesSent": result.data.totalBytes,
                            "responseCode": result.data.responseCode,
                            "response": result.data.responseBody ?? "",
                            "headers": headersDict
                        ]
                        self.sendSuccess(command, uploadResult)
                    }
                }
            ).store(in: &cancellables)
        } catch {
            sendError(command, error.toFileTransferError())
        }
    }
    
    @objc(addListener:)
    func addListener(command: CDVInvokedUrlCommand) {
        listeners.append(command)
    }
    
    @objc(removeAllListeners:)
    func removeAllListeners(command: CDVInvokedUrlCommand) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK)
        commandDelegate.send(result, callbackId: command.callbackId)
        
        for listener in listeners {
            let result = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "removeAllListeners was called")
            commandDelegate.send(result, callbackId: listener.callbackId)
        }
        
        listeners.removeAll()
    }
    
    // MARK: - Helper Methods
    
    private var cancellables = Set<AnyCancellable>()
    
    private struct DownloadOptions {
        let serverURL: URL
        let fileURL: URL
        let shouldTrackProgress: Bool
        let httpOptions: IONFLTRHttpOptions
    }
    
    private struct UploadOptions {
        let serverURL: URL
        let fileURL: URL
        let shouldTrackProgress: Bool
        let uploadOptions: IONFLTRUploadOptions
        let httpOptions: IONFLTRHttpOptions
    }
    
    private func parseDownloadOptions(_ command: CDVInvokedUrlCommand) throws -> DownloadOptions {
        guard let options = command.arguments[0] as? [String: Any] else {
            throw OSFileTransferError.invalidParameters
        }
        
        guard let urlString = options["url"] as? String, !urlString.isEmpty else {
            throw OSFileTransferError.urlEmpty
        }
        
        guard let serverURL = URL(string: urlString) else {
            throw OSFileTransferError.invalidServerUrl(url: urlString)
        }
        
        guard let filePath = options["path"] as? String, !filePath.isEmpty else {
            throw OSFileTransferError.invalidParameters
        }
        
        guard let fileURL = URL(string: filePath) else {
            throw OSFileTransferError.invalidParameters
        }
        
        let shouldTrackProgress = options["progress"] as? Bool ?? false
        
        let httpOptions = createHttpOptions(from: options, defaultMethod: "GET")
        
        return DownloadOptions(
            serverURL: serverURL,
            fileURL: fileURL,
            shouldTrackProgress: shouldTrackProgress,
            httpOptions: httpOptions
        )
    }
    
    private func parseUploadOptions(_ command: CDVInvokedUrlCommand) throws -> UploadOptions {
        guard let options = command.arguments[0] as? [String: Any] else {
            throw OSFileTransferError.invalidParameters
        }
        
        guard let urlString = options["url"] as? String, !urlString.isEmpty else {
            throw OSFileTransferError.urlEmpty
        }
        
        guard let serverURL = URL(string: urlString) else {
            throw OSFileTransferError.invalidServerUrl(url: urlString)
        }
        
        guard let filePath = options["path"] as? String, !filePath.isEmpty else {
            throw OSFileTransferError.invalidParameters
        }
        
        guard let fileURL = URL(string: filePath) else {
            throw OSFileTransferError.invalidParameters
        }
        
        let shouldTrackProgress = options["progress"] as? Bool ?? false
        let chunkedMode = options["chunkedMode"] as? Bool ?? false
        let mimeType = options["mimeType"] as? String
        let fileKey = options["fileKey"] as? String ?? "file"
        
        let uploadOptions = IONFLTRUploadOptions(
            chunkedMode: chunkedMode,
            mimeType: mimeType,
            fileKey: fileKey
        )
        
        let httpOptions = createHttpOptions(from: options, defaultMethod: "POST")
        
        return UploadOptions(
            serverURL: serverURL,
            fileURL: fileURL,
            shouldTrackProgress: shouldTrackProgress,
            uploadOptions: uploadOptions,
            httpOptions: httpOptions
        )
    }
    
    private func createHttpOptions(from options: [String: Any], defaultMethod: String) -> IONFLTRHttpOptions {
        let method = options["method"] as? String ?? defaultMethod
        let headers = options["headers"] as? [String: String] ?? [:]
        let params = extractParams(from: options["params"] as? [String: Any] ?? [:])
        let timeout = (options["connectTimeout"] as? Int ?? 60000) / 1000  // Convert ms to seconds
        let disableRedirects = options["disableRedirects"] as? Bool ?? false
        let shouldEncodeUrlParams = options["shouldEncodeUrlParams"] as? Bool ?? true
        
        return IONFLTRHttpOptions(
            method: method,
            params: params,
            headers: headers,
            timeout: Double(timeout),
            disableRedirects: disableRedirects,
            shouldEncodeUrlParams: shouldEncodeUrlParams
        )
    }
    
    private func extractParams(from params: [String: Any]) -> [String: [String]] {
        var result: [String: [String]] = [:]
        
        for (key, value) in params {
            if let stringValue = value as? String {
                result[key] = [stringValue]
            } else if let arrayValue = value as? [Any] {
                let stringArray = arrayValue.compactMap { $0 as? String }
                if !stringArray.isEmpty {
                    result[key] = stringArray
                }
            }
        }
        
        return result
    }
    
    /**
     * Notify progress to listeners
     * Throttled to every 100ms to avoid excessive callbacks
     * 
     * @param transferType The type of transfer ("download" or "upload")
     * @param url The URL of the file being transferred
     * @param status The status of the transfer containing bytes, contentLength, etc.
     * @param forceUpdate If true, sends the update regardless of throttling
     */
    private func notifyProgress(_ transferType: String, _ url: String, _ status: IONFLTRProgressStatus, forceUpdate: Bool = false) {
        let currentTime = Date().timeIntervalSince1970
        
        if forceUpdate || (currentTime - lastProgressUpdate >= progressUpdateInterval) {
            let progressData: [String: Any] = [
                "type": transferType,
                "url": url,
                "bytes": status.bytes,
                "contentLength": status.contentLength,
                "lengthComputable": status.lengthComputable
            ]
            
            for listener in listeners {
                let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: progressData)
                result?.keepCallback = true
                commandDelegate.send(result, callbackId: listener.callbackId)
            }
            
            lastProgressUpdate = currentTime
        }
    }
    
    private func sendSuccess(_ command: CDVInvokedUrlCommand, _ result: [String: Any] = [:]) {
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: result)
        commandDelegate.send(pluginResult, callbackId: command.callbackId)
    }
    
    private func sendError(_ command: CDVInvokedUrlCommand, _ error: OSFileTransferError) {
        let errorDictionary = [
            "code": error.code,
            "message": error.description,
            "source": error.source,
            "target": error.target,
            "httpStatus": error.httpStatus,
            "body": error.body,
        ].compactMapValues { $0 }
        
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: errorDictionary)
        commandDelegate.send(pluginResult, callbackId: command.callbackId)
    }
}

extension Error {
    func toFileTransferError() -> OSFileTransferError {
        if let error = self as? OSFileTransferError {
            return error
        } else if let error = self as? IONFLTRException {
            return error.toFileTransferError()
        } else {
            return .genericError(message: localizedDescription)
        }
    }
}
