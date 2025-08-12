import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

export interface DevScriptsOptions {
  verbose?: boolean;
  dryRun?: boolean;
}

export class DevScripts {
  private options: DevScriptsOptions;

  constructor(options: DevScriptsOptions = {}) {
    this.options = {
      verbose: false,
      dryRun: false,
      ...options,
    };
  }

  /**
   * Run linting across all packages
   */
  async lintAll(): Promise<void> {
    this.log('Running lint across all packages...');
    
    const packages = this.getPackages();
    
    for (const pkg of packages) {
      if (this.hasScript(pkg, 'lint')) {
        this.log(`Linting ${pkg}...`);
        if (!this.options.dryRun) {
          try {
            execSync('npm run lint', { 
              cwd: pkg, 
              stdio: this.options.verbose ? 'inherit' : 'pipe' 
            });
            this.log(`✅ ${pkg} linting passed`);
          } catch (error) {
            this.log(`❌ ${pkg} linting failed`);
            throw error;
          }
        }
      }
    }
  }

  /**
   * Build all packages in dependency order
   */
  async buildAll(): Promise<void> {
    this.log('Building all packages...');
    
    const packages = this.getPackagesInBuildOrder();
    
    for (const pkg of packages) {
      if (this.hasScript(pkg, 'build')) {
        this.log(`Building ${pkg}...`);
        if (!this.options.dryRun) {
          try {
            execSync('npm run build', { 
              cwd: pkg, 
              stdio: this.options.verbose ? 'inherit' : 'pipe' 
            });
            this.log(`✅ ${pkg} build completed`);
          } catch (error) {
            this.log(`❌ ${pkg} build failed`);
            throw error;
          }
        }
      }
    }
  }

  /**
   * Check for outdated dependencies across all packages
   */
  async checkOutdated(): Promise<void> {
    this.log('Checking for outdated dependencies...');
    
    const packages = this.getPackages();
    
    for (const pkg of packages) {
      this.log(`Checking ${pkg}...`);
      if (!this.options.dryRun) {
        try {
          execSync('npm outdated', { 
            cwd: pkg, 
            stdio: this.options.verbose ? 'inherit' : 'pipe' 
          });
        } catch (error) {
          // npm outdated exits with code 1 when outdated packages are found
          // This is expected behavior, so we don't throw
          this.log(`📦 ${pkg} has outdated dependencies`);
        }
      }
    }
  }

  /**
   * Clean all build artifacts
   */
  async cleanAll(): Promise<void> {
    this.log('Cleaning build artifacts...');
    
    const packages = this.getPackages();
    
    for (const pkg of packages) {
      this.log(`Cleaning ${pkg}...`);
      if (!this.options.dryRun) {
        try {
          // Clean common build directories
          const dirsToClean = ['dist', 'build', '.next', '.turbo'];
          for (const dir of dirsToClean) {
            const fullPath = path.join(pkg, dir);
            if (existsSync(fullPath)) {
              execSync(`rm -rf ${dir}`, { cwd: pkg });
              this.log(`🧹 Removed ${fullPath}`);
            }
          }
        } catch (error) {
          this.log(`❌ Failed to clean ${pkg}`);
          throw error;
        }
      }
    }
  }

  /**
   * Install dependencies for all packages
   */
  async installAll(): Promise<void> {
    this.log('Installing dependencies for all packages...');
    
    // Install root dependencies first
    this.log('Installing root dependencies...');
    if (!this.options.dryRun) {
      execSync('npm install', { 
        stdio: this.options.verbose ? 'inherit' : 'pipe' 
      });
    }
    
    this.log('✅ All dependencies installed');
  }

  private getPackages(): string[] {
    // In a monorepo, we typically have apps and packages
    const packages: string[] = [];
    
    ['apps', 'packages'].forEach(dir => {
      if (existsSync(dir)) {
        const entries = execSync(`ls ${dir}`, { encoding: 'utf-8' })
          .trim()
          .split('\n')
          .filter(Boolean);
        
        entries.forEach(entry => {
          const fullPath = path.join(dir, entry);
          if (existsSync(path.join(fullPath, 'package.json'))) {
            packages.push(fullPath);
          }
        });
      }
    });
    
    return packages;
  }

  private getPackagesInBuildOrder(): string[] {
    const packages = this.getPackages();
    
    // Simple ordering: packages first, then apps
    const packageOrder = packages.sort((a, b) => {
      if (a.startsWith('packages/') && b.startsWith('apps/')) return -1;
      if (a.startsWith('apps/') && b.startsWith('packages/')) return 1;
      return a.localeCompare(b);
    });
    
    return packageOrder;
  }

  private hasScript(packagePath: string, scriptName: string): boolean {
    try {
      const packageJson = JSON.parse(
        readFileSync(path.join(packagePath, 'package.json'), 'utf-8')
      );
      return packageJson.scripts && packageJson.scripts[scriptName];
    } catch {
      return false;
    }
  }

  private log(message: string): void {
    if (this.options.verbose) {
      console.log(message);
    }
  }
}

// Convenience functions for direct usage
export const devScripts = new DevScripts({ verbose: true });

export const lintAll = () => devScripts.lintAll();
export const buildAll = () => devScripts.buildAll();
export const cleanAll = () => devScripts.cleanAll();
export const checkOutdated = () => devScripts.checkOutdated();
export const installAll = () => devScripts.installAll();