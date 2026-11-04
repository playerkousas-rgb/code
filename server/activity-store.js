// In-memory store is for tests only. The deployed Worker injects D1.
export const ACTIVITY_TTL_SECONDS = 7 * 24 * 60 * 60;
function ttlSeconds(value, now = Date.now()) {
  if (!Number.isSafeInteger(value?.expiresAt) || value.expiresAt <= now) return 0;
  return Math.max(1, Math.ceil((value.expiresAt - now) / 1000));
}

// Explicitly opt-in test/dev store; never a silent production fallback.
export function createMemoryActivityStore() {
  const records = new Map();
  return {
    async get(id) {
      const entry = records.get(id);
      if (!entry || entry.expires <= Date.now()) { records.delete(id); return null; }
      return structuredClone(entry.value);
    },
    async create(id, value) {
      const previous = records.get(id);
      if (previous && previous.expires > Date.now()) return false;
      if (!ttlSeconds(value)) return false;
      records.set(id, { value: structuredClone(value), expires: value.expiresAt }); return true;
    },
    async compareSet(id, expected, value) {
      const previous = records.get(id);
      if (!previous || previous.expires <= Date.now()) { records.delete(id); return 0; }
      if (previous.value.version !== expected) return -1;
      if (!ttlSeconds(value)) return 0;
      records.set(id, { value: structuredClone(value), expires: value.expiresAt }); return 1;
    },
    async compareDelete(id, expected) {
      const previous = records.get(id);
      if (!previous || previous.expires <= Date.now()) { records.delete(id); return 0; }
      if (previous.value.version !== expected) return -1;
      records.delete(id); return 1;
    },
  };
}
