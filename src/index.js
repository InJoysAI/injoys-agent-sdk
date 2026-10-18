/**
 * injoys-agent-sdk Core Module
 *
 * Exports utilities for programmatic use of injoys-agent-sdk.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/** Where templates are installed inside a target project (shared with scripts/install.sh). */
const INSTALL_DIR = path.join('design', 'context-dev');

/** Project-level workflow directory: always installed, not tied to any AI tool. */
const WORKFLOWS_DIR = path.join('.agents', 'workflows');

/** Legacy workflow directory (before the rename to `.agents/workflows`). */
const LEGACY_WORKFLOWS_DIR = path.join('.agent', 'workflows');

/** Optional extra command directories of specific AI tools (relative to the project root). */
const AI_TOOL_DIRS = {
    claude: path.join('.claude', 'commands'),
    cursor: path.join('.cursor', 'commands'),
    devin: path.join('.devin', 'workflows'),
    qoder: path.join('.qoder', 'commands')
};

/** Commands bootstrapped on install; the rest are installed after /context-init. */
const BOOTSTRAP_COMMANDS = ['context-init.md', 'context-check.md'];

/**
 * Calculate SHA256 hash of a file
 * @param {string} filePath - Path to file
 * @returns {string} SHA256 hash
 */
function calculateHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Copy directory recursively
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {string[]} excludes - Files/dirs to exclude
 * @param {object} [options]
 * @param {boolean} [options.overwrite=true] - Overwrite files that already exist
 * @param {boolean} [options.dryRun=false] - Report what would happen without writing
 * @returns {{copied: string[], skipped: string[]}} Destination paths copied / skipped
 */
function copyDir(src, dest, excludes = [], options = {}) {
    const { overwrite = true, dryRun = false } = options;
    const result = { copied: [], skipped: [] };

    if (!dryRun) {
        fs.mkdirSync(dest, { recursive: true });
    }

    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (excludes.includes(entry.name)) continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            const sub = copyDir(srcPath, destPath, excludes, options);
            result.copied.push(...sub.copied);
            result.skipped.push(...sub.skipped);
        } else if (!overwrite && fs.existsSync(destPath)) {
            result.skipped.push(destPath);
        } else {
            if (!dryRun) fs.copyFileSync(srcPath, destPath);
            result.copied.push(destPath);
        }
    }

    return result;
}

/**
 * Copy selected files from one directory into another.
 * Missing source files are ignored.
 * @returns {{copied: string[], skipped: string[]}}
 */
function copyFiles(srcDir, destDir, names, options = {}) {
    const { overwrite = true, dryRun = false } = options;
    const result = { copied: [], skipped: [] };

    for (const name of names) {
        const srcPath = path.join(srcDir, name);
        const destPath = path.join(destDir, name);
        if (!fs.existsSync(srcPath)) continue;

        if (!overwrite && fs.existsSync(destPath)) {
            result.skipped.push(destPath);
            continue;
        }
        if (!dryRun) {
            fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(srcPath, destPath);
        }
        result.copied.push(destPath);
    }

    return result;
}

/**
 * Read and parse context manifest
 * @param {string} projectRoot - Project root path
 * @returns {object|null} Manifest object, or null when the manifest does not exist
 * @throws {Error} When the manifest exists but cannot be read or parsed
 */
function readManifest(projectRoot) {
    const manifestPath = path.join(projectRoot, '.context', 'context-manifest.json');

    if (!fs.existsSync(manifestPath)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
        throw new Error(`Invalid context manifest at ${manifestPath}: ${e.message}`);
    }
}

module.exports = {
    INSTALL_DIR,
    WORKFLOWS_DIR,
    LEGACY_WORKFLOWS_DIR,
    AI_TOOL_DIRS,
    BOOTSTRAP_COMMANDS,
    calculateHash,
    copyDir,
    copyFiles,
    readManifest
};
