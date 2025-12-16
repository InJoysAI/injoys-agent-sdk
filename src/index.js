/**
 * injoys-agent-sdk Core Module
 * 
 * Exports utilities for programmatic use of injoys-agent-sdk.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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
 */
function copyDir(src, dest, excludes = []) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        if (excludes.includes(entry.name)) continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, excludes);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Read and parse context manifest
 * @param {string} projectRoot - Project root path
 * @returns {object|null} Manifest object or null
 */
function readManifest(projectRoot) {
    const manifestPath = path.join(projectRoot, '.context', 'context-manifest.json');

    if (fs.existsSync(manifestPath)) {
        try {
            return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (e) {
            return null;
        }
    }
    return null;
}

module.exports = {
    calculateHash,
    copyDir,
    readManifest
};
