import Foundation
import IONFileTransferLib

enum OSFileTransferError: Error {
    case invalidParameters
    case invalidServerUrl(url: String)
    case urlEmpty
    case permissionDenied
    case fileDoesNotExist
    case connectionError
    case notModified
    case httpError(responseCode: Int, responseBody: String?, headers: [String: [String]]?)
    case genericError(message: String)
    
    var codeNumber: Int {
        switch self {
        case .invalidParameters: return 5
        case .invalidServerUrl, .urlEmpty: return 6
        case .permissionDenied: return 7
        case .fileDoesNotExist: return 8
        case .connectionError: return 9
        case .notModified: return 10
        case .httpError: return 11
        case .genericError: return 12
        }
    }
    
    var code: String {
        return "OS-PLUG-FLTR-\(String(format: "%04d", codeNumber))"
    }
    
    var description: String {
        switch self {
        case .invalidParameters: return "The method's input parameters aren't valid."
        case .invalidServerUrl(let url): return "Invalid server URL was provided - \(url)"
        case .urlEmpty: return "URL to connect to is either null or empty."
        case .permissionDenied: return "Unable to perform operation, user denied permission request."
        case .fileDoesNotExist: return "Operation failed because file does not exist."
        case .connectionError: return "Failed to connect to server."
        case .notModified: return "The server responded with HTTP 304 – Not Modified. If you want to avoid this, check your headers related to HTTP caching."
        case .httpError(let responseCode, _, _): return "HTTP error: \(responseCode) - \(HTTPURLResponse.localizedString(forStatusCode: responseCode))"
        case .genericError(let message): return "The operation failed with an error - \(message)"
        }
    }
    
    var source: String? {
        return nil
    }
    
    var target: String? {
        return nil
    }
    
    var httpStatus: Int? {
        switch self {
        case .notModified: return 304
        case .httpError(let responseCode, _, _): return responseCode
        default: return nil
        }
    }
    
    var body: String? {
        switch self {
        case .httpError(_, let responseBody, _): return responseBody
        default: return nil
        }
    }
    
    var headers: [String: [String]]? {
        switch self {
        case .httpError(_, _, let headers): return headers
        default: return nil
        }
    }
    
    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "code": code,
            "message": description
        ]
        
        if let source = source {
            dict["source"] = source
        }
        
        if let target = target {
            dict["target"] = target
        }
        
        if let httpStatus = httpStatus {
            dict["httpStatus"] = httpStatus
        }
        
        if let body = body {
            dict["body"] = body
        }
        
        if let headers = headers {
            let headersDict = headers.mapValues { $0.first ?? "" }
            dict["headers"] = headersDict
        }
        
        return dict
    }
}

extension IONFLTRException {
    func toFileTransferError() -> OSFileTransferError {
        switch self {
        case .invalidPath(_):
            return .invalidParameters
        case .emptyURL(_):
            return .urlEmpty
        case .invalidURL(let url):
            return .invalidServerUrl(url: url)
        case .fileDoesNotExist(_):
            return .fileDoesNotExist
        case .cannotCreateDirectory(let message, _):
            return .genericError(message: message)
        case .httpError(let responseCode, let responseBody, let headers):
            return responseCode == 304
                ? .notModified
                : .httpError(responseCode: responseCode, responseBody: responseBody, headers: headers)
        case .connectionError(_):
            return .connectionError
        case .transferError(let message):
            return .genericError(message: message)
        case .unknownError(let cause):
            return .genericError(message: cause?.localizedDescription ?? "Unknown error")
        }
    }
} 