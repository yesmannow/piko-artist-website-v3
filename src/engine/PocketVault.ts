/**
 * PocketVault.ts - Local storage service for session recordings
 *
 * Phase X: Local storage system for Piko session recordings and metadata
 *
 * Features:
 * - IndexedDB-based storage for large blobs
 * - Metadata storage with tracklists
 * - Compression and deduplication
 * - Export/import functionality
 */

export interface RecordingMetadata {
  id: string;
  title: string;
  djName: string;
  description?: string;
  duration: number; // seconds
  createdAt: Date;
  format: "audio/webm" | "audio/ogg" | "video/webm";
  bitRate: number; // kbps
  fileSize: number; // bytes
  tracklist: TrackEntry[];
  tags?: string[];
}

export interface TrackEntry {
  id: string;
  title: string;
  artist: string;
  startTime: number; // seconds into recording
  endTime: number; // seconds into recording
  bpm?: number;
  camelot?: string;
}

export interface VaultStats {
  totalRecordings: number;
  totalSize: number; // bytes
  oldestRecording: Date | null;
  newestRecording: Date | null;
}

/**
 * PocketVault - Local storage service for session recordings
 */
class PocketVault {
  private static instance: PocketVault | null = null;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = "PikoPocketVault";
  private readonly DB_VERSION = 1;

  // Private constructor enforces singleton
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PocketVault {
    if (!PocketVault.instance) {
      PocketVault.instance = new PocketVault();
    }
    return PocketVault.instance;
  }

  /**
   * Initialize the vault database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open Pocket Vault database"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("[PocketVault] Database initialized");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Recordings store (metadata + blob reference)
        if (!db.objectStoreNames.contains("recordings")) {
          const recordingsStore = db.createObjectStore("recordings", {
            keyPath: "id",
          });
          recordingsStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
          recordingsStore.createIndex("djName", "djName", { unique: false });
          recordingsStore.createIndex("tags", "tags", {
            unique: false,
            multiEntry: true,
          });
        }

        // Blobs store (actual audio/video data)
        if (!db.objectStoreNames.contains("blobs")) {
          db.createObjectStore("blobs", { keyPath: "id" });
        }

        console.log("[PocketVault] Database schema created");
      };
    });
  }

  /**
   * Store a recording with metadata
   */
  async storeRecording(
    metadata: Omit<RecordingMetadata, "id">,
    blob: Blob,
  ): Promise<string> {
    if (!this.db) {
      throw new Error("Pocket Vault not initialized");
    }

    const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const blobId = `blob_${recordingId}`;

    // Store blob first
    await this.storeBlob(blobId, blob);

    // Create metadata with ID
    const fullMetadata: RecordingMetadata = {
      ...metadata,
      id: recordingId,
    };

    // Store metadata
    await this.storeMetadata(fullMetadata);

    console.log(`[PocketVault] Stored recording: ${fullMetadata.title}`);
    return recordingId;
  }

  /**
   * Store blob data
   */
  private async storeBlob(blobId: string, blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["blobs"], "readwrite");
      const store = transaction.objectStore("blobs");

      const request = store.put({
        id: blobId,
        data: blob,
        storedAt: new Date(),
        size: blob.size,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to store blob"));
    });
  }

  /**
   * Store metadata
   */
  private async storeMetadata(metadata: RecordingMetadata): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["recordings"], "readwrite");
      const store = transaction.objectStore("recordings");

      const request = store.put(metadata);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to store metadata"));
    });
  }

  /**
   * Retrieve a recording
   */
  async getRecording(
    recordingId: string,
  ): Promise<{ metadata: RecordingMetadata; blob: Blob } | null> {
    if (!this.db) {
      throw new Error("Pocket Vault not initialized");
    }

    const metadata = await this.getMetadata(recordingId);
    if (!metadata) return null;

    const blobId = `blob_${recordingId}`;
    const blob = await this.getBlob(blobId);
    if (!blob) return null;

    return { metadata, blob };
  }

  /**
   * Get metadata only
   */
  async getMetadata(recordingId: string): Promise<RecordingMetadata | null> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction(["recordings"], "readonly");
      const store = transaction.objectStore("recordings");
      const request = store.get(recordingId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Get blob data
   */
  private async getBlob(blobId: string): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction(["blobs"], "readonly");
      const store = transaction.objectStore("blobs");
      const request = store.get(blobId);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Get all recordings (metadata only)
   */
  async getAllRecordings(): Promise<RecordingMetadata[]> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction(["recordings"], "readonly");
      const store = transaction.objectStore("recordings");
      const index = store.index("createdAt");

      const request = index.openCursor(null, "prev"); // Most recent first
      const results: RecordingMetadata[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  }

  /**
   * Search recordings by DJ name, title, or tags
   */
  async searchRecordings(query: string): Promise<RecordingMetadata[]> {
    const allRecordings = await this.getAllRecordings();
    const lowerQuery = query.toLowerCase();

    return allRecordings.filter(
      (recording) =>
        recording.title.toLowerCase().includes(lowerQuery) ||
        recording.djName.toLowerCase().includes(lowerQuery) ||
        recording.description?.toLowerCase().includes(lowerQuery) ||
        recording.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      // Delete metadata
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(["recordings"], "readwrite");
        const store = transaction.objectStore("recordings");
        const request = store.delete(recordingId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Failed to delete metadata"));
      });

      // Delete blob
      const blobId = `blob_${recordingId}`;
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(["blobs"], "readwrite");
        const store = transaction.objectStore("blobs");
        const request = store.delete(blobId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Failed to delete blob"));
      });

      console.log(`[PocketVault] Deleted recording: ${recordingId}`);
      return true;
    } catch (error) {
      console.error(
        `[PocketVault] Failed to delete recording ${recordingId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Get vault statistics
   */
  async getStats(): Promise<VaultStats> {
    const recordings = await this.getAllRecordings();

    if (recordings.length === 0) {
      return {
        totalRecordings: 0,
        totalSize: 0,
        oldestRecording: null,
        newestRecording: null,
      };
    }

    const totalSize = recordings.reduce(
      (sum, recording) => sum + recording.fileSize,
      0,
    );
    const dates = recordings.map((r) => r.createdAt);

    return {
      totalRecordings: recordings.length,
      totalSize,
      oldestRecording: new Date(Math.min(...dates.map((d) => d.getTime()))),
      newestRecording: new Date(Math.max(...dates.map((d) => d.getTime()))),
    };
  }

  /**
   * Export recording as downloadable file
   */
  async exportRecording(recordingId: string, filename?: string): Promise<void> {
    const recording = await this.getRecording(recordingId);
    if (!recording) {
      throw new Error("Recording not found");
    }

    const { metadata, blob } = recording;
    const finalFilename =
      filename || `${metadata.djName}_${metadata.title}.webm`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all recordings
   */
  async clearVault(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(
      ["recordings", "blobs"],
      "readwrite",
    );
    const recordingsStore = transaction.objectStore("recordings");
    const blobsStore = transaction.objectStore("blobs");

    // Clear both stores
    recordingsStore.clear();
    blobsStore.clear();

    console.log("[PocketVault] Vault cleared");
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  dispose(): void {
    this.close();
    console.log("[PocketVault] Disposed");
  }
}

// Export singleton instance getter
export const getPocketVault = () => PocketVault.getInstance();
