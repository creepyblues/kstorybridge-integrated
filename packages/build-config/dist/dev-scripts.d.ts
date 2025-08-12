export interface DevScriptsOptions {
    verbose?: boolean;
    dryRun?: boolean;
}
export declare class DevScripts {
    private options;
    constructor(options?: DevScriptsOptions);
    /**
     * Run linting across all packages
     */
    lintAll(): Promise<void>;
    /**
     * Build all packages in dependency order
     */
    buildAll(): Promise<void>;
    /**
     * Check for outdated dependencies across all packages
     */
    checkOutdated(): Promise<void>;
    /**
     * Clean all build artifacts
     */
    cleanAll(): Promise<void>;
    /**
     * Install dependencies for all packages
     */
    installAll(): Promise<void>;
    private getPackages;
    private getPackagesInBuildOrder;
    private hasScript;
    private log;
}
export declare const devScripts: DevScripts;
export declare const lintAll: () => Promise<void>;
export declare const buildAll: () => Promise<void>;
export declare const cleanAll: () => Promise<void>;
export declare const checkOutdated: () => Promise<void>;
export declare const installAll: () => Promise<void>;
