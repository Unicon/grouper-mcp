import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Configuration manager for Grouper MCP server
 * Handles loading configuration from properties file and environment variables
 */
export class Config {
  private properties: Map<string, string> = new Map();
  private static instance: Config;

  private constructor() {
    this.loadPropertiesFile();
  }

  /**
   * Get singleton instance of Config
   */
  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * Load properties from config file if it exists
   */
  private loadPropertiesFile(): void {
    const configPath = join(process.cwd(), 'config', 'grouper-mcp.properties');

    if (!existsSync(configPath)) {
      return;
    }

    try {
      const content = readFileSync(configPath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }

        // Parse key=value pairs
        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex > 0) {
          const key = trimmed.substring(0, equalsIndex).trim();
          const value = trimmed.substring(equalsIndex + 1).trim();
          this.properties.set(key, value);
        }
      }
    } catch (error) {
      // If we can't read the file, just continue without it
      console.error('Warning: Could not read properties file:', error);
    }
  }

  /**
   * Get a configuration value
   * Priority: properties file > environment variable > default
   */
  public get(propertyKey: string, envKey?: string, defaultValue?: string): string | undefined {
    // Check properties file first (highest priority)
    if (this.properties.has(propertyKey)) {
      return this.properties.get(propertyKey);
    }

    // Check environment variable
    if (envKey && process.env[envKey] !== undefined) {
      return process.env[envKey];
    }

    // Return default
    return defaultValue;
  }

  /**
   * Get a boolean configuration value
   */
  public getBoolean(propertyKey: string, envKey?: string, defaultValue: boolean = false): boolean {
    const value = this.get(propertyKey, envKey);

    if (value === undefined) {
      return defaultValue;
    }

    return value.toLowerCase() === 'true';
  }
}

// Export singleton instance
export const config = Config.getInstance();
