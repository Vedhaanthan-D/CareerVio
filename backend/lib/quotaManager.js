import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QUOTA_FILE = path.resolve(__dirname, '../.quota-usage.json');

/** Manages API key quota limits and usage tracking. */
export class QuotaManager {
  constructor() {
    this.usage = {};
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(QUOTA_FILE)) {
        this.usage = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf8'));
      }
    } catch (e) {
      console.warn('[Quota] Failed to load quota file, starting fresh:', e.message);
    }
  }

  _save() {
    try {
      fs.writeFileSync(QUOTA_FILE, JSON.stringify(this.usage, null, 2), 'utf8');
    } catch (e) {
      console.error('[Quota] Failed to save quota file:', e.message);
    }
  }

  _evictOld(provider) {
    if (!this.usage[provider]) {
      this.usage[provider] = [];
    }
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.usage[provider] = this.usage[provider].filter(ts => ts > cutoff);
  }

  /** Checks if the provider is within RPM and RPD limits. */
  checkQuota(provider, rpm, rpd) {
    this._evictOld(provider);
    const now = Date.now();
    const minCount = this.usage[provider].filter(ts => ts > now - 60_000).length;
    const dayCount = this.usage[provider].filter(ts => ts > now - 86_400_000).length;
    if (minCount >= rpm) {
      return { ok: false, reason: `RPM limit reached (${minCount}/${rpm})` };
    }
    if (dayCount >= rpd) {
      return { ok: false, reason: `RPD limit reached (${dayCount}/${rpd})` };
    }
    return { ok: true };
  }

  /** Records an API call timestamp for quota tracking. */
  recordCall(provider) {
    if (!this.usage[provider]) {
      this.usage[provider] = [];
    }
    this.usage[provider].push(Date.now());
    this._save();
  }
}

/** Global instance of the QuotaManager class. */
export const quotaManager = new QuotaManager();
