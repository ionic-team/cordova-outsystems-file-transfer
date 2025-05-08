declare class OSFileTransferWrapper {
    private listenersCount;
    downloadFile(options: any, scope: any): void;
    /**
     * Helper method to complete the download operation and notify the callback
     */
    private completeDownload;
    uploadFile(options: any, scope: any): void;
    private handleTransferFinished;
    private isPWA;
    private isCapacitorPluginDefined;
    /**
     * Check that is required because MABS 12 isnt installing synapse dependency for capacitor plugins.
     * Once MABS 12 no longer has that limitation, this can be removed.
     * @returns true if synapse is defined, false otherwise
     */
    private isSynapseDefined;
    /**
     * Checks if the OSFilePluginWrapper is available
     * @returns true if the File Plugin is defined, false otherwise
     */
    private isFilePluginAvailable;
}
export declare const Instance: OSFileTransferWrapper;
export {};
