import { DownloadFileOptions, UploadFileOptions } from '../../cordova-plugin/src/definitions';
declare class OSFileTransferWrapper {
    private listenersCount;
    downloadFile(options: DownloadFileOptions, scope: any): void;
    uploadFile(options: UploadFileOptions, scope: any): void;
    private handleTransferFinished;
    private isPWA;
    private isCapacitorPluginDefined;
    /**
     * Check that is required because MABS 12 isnt installing synapse dependency for capacitor plugins.
     * Once MABS 12 no longer has that limitation, this can be removed.
     * @returns true if synapse is defined, false otherwise
     */
    private isSynapseDefined;
}
export declare const Instance: OSFileTransferWrapper;
export {};
