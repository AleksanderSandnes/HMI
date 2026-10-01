export interface StringStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

interface Manifest {
  active: number;
  counts: [number, number];
}

// 400 Unicode code points fit within SecureStore's 2 KiB value limit.
const CHUNK_SIZE = 400;
const MAX_CHUNKS = 256;

function validCounts(counts: unknown): counts is [number, number] {
  return (
    Array.isArray(counts) &&
    counts.length === 2 &&
    counts.every(
      (count: unknown) =>
        Number.isInteger(count) && Number(count) >= 0 && Number(count) <= MAX_CHUNKS,
    )
  );
}

function parseManifest(raw: string | null): Manifest {
  if (raw === null) return { active: 0, counts: [0, 0] };
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null || !("active" in value) || !("counts" in value)) {
    throw new Error("Invalid secure session metadata");
  }
  const { active, counts } = value;
  if ((active !== 0 && active !== 1) || !validCounts(counts)) {
    throw new Error("Invalid secure session metadata");
  }
  return { active, counts: [Number(counts[0]), Number(counts[1])] };
}

/** Encrypted session persistence, including a one-time migration from plaintext. */
export function createSessionStorage(secure: StringStorage, legacy: StringStorage): StringStorage {
  let pending: Promise<unknown> = Promise.resolve();
  const manifestKey = (key: string) => `${key}.secure-manifest`;
  const chunkKey = (key: string, bank: number, index: number) => `${key}.secure-${bank}-${index}`;
  const readManifest = async (key: string) => parseManifest(await secure.getItem(manifestKey(key)));

  function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation);
    pending = result.catch(() => undefined);
    return result;
  }

  async function write(key: string, value: string): Promise<void> {
    const points = Array.from(value);
    const chunks: string[] = [];
    for (let offset = 0; offset < points.length; offset += CHUNK_SIZE) {
      chunks.push(points.slice(offset, offset + CHUNK_SIZE).join(""));
    }
    if (chunks.length === 0) chunks.push("");
    if (chunks.length > MAX_CHUNKS) throw new Error("Session exceeds secure storage capacity");
    const manifest = await readManifest(key);
    const target = 1 - manifest.active;
    const previousCount = manifest.counts[target];
    // Record all keys before writing, so interrupted writes can be erased on logout.
    manifest.counts[target] = Math.max(previousCount, chunks.length);
    await secure.setItem(manifestKey(key), JSON.stringify(manifest));
    for (const [index, chunk] of chunks.entries()) {
      await secure.setItem(chunkKey(key, target, index), chunk);
    }
    for (let index = chunks.length; index < previousCount; index++) {
      await secure.removeItem(chunkKey(key, target, index));
    }
    manifest.counts[target] = chunks.length;
    manifest.active = target;
    // The active bank changes only after every new chunk has been persisted.
    await secure.setItem(manifestKey(key), JSON.stringify(manifest));
    await legacy.removeItem(key);
  }

  async function read(key: string): Promise<string | null> {
    const manifest = await readManifest(key);
    const count = manifest.counts[manifest.active];
    if (count === 0) {
      const oldValue = await legacy.getItem(key);
      if (oldValue !== null) await write(key, oldValue);
      return oldValue;
    }
    const chunks: string[] = [];
    for (let index = 0; index < count; index++) {
      const chunk = await secure.getItem(chunkKey(key, manifest.active, index));
      if (chunk === null) throw new Error("Secure session data is incomplete");
      chunks.push(chunk);
    }
    await legacy.removeItem(key);
    return chunks.join("");
  }

  async function remove(key: string): Promise<void> {
    const manifest = await readManifest(key);
    await legacy.removeItem(key);
    for (const [bank, count] of manifest.counts.entries()) {
      for (let index = 0; index < count; index++) {
        await secure.removeItem(chunkKey(key, bank, index));
      }
    }
    await secure.removeItem(manifestKey(key));
  }

  return {
    getItem: (key) => serialize(() => read(key)),
    setItem: (key, value) => serialize(() => write(key, value)),
    removeItem: (key) => serialize(() => remove(key)),
  };
}
