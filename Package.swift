// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "com.outsystems.plugins.filetransfer",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "com.outsystems.plugins.filetransfer",
            targets: ["OSFileTransferPlugin"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/apache/cordova-ios.git", branch: "master"),
        .package(url: "https://github.com/ionic-team/ion-ios-filetransfer.git", exact: "2.0.0")
    ],
    targets: [
        .target(
            name: "OSFileTransferPlugin",
            dependencies: [
                .product(name: "Cordova", package: "cordova-ios"),
                .product(name: "IONFileTransferLib", package: "ion-ios-filetransfer")
            ],
            path: "packages/cordova-plugin/ios"
        )
    ]
)
