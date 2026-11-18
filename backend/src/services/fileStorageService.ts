import fs from 'fs';
import path from 'path';
import { prisma } from '../database/client';
import { settings } from '../core/config';

export type FileType = 'avatar' | 'resume';

export interface StoredFileData {
  id?: string;
  filename: string;
  contentType: string;
  data: Buffer;
  fileSize: number;
}

export class FileStorageService {
  private static readonly UPLOAD_DIR = settings.UPLOAD_DIR;

  /**
   * Save a file persistently in Supabase PostgreSQL (StoredFile table)
   * and mirror to local UPLOAD_DIR for local disk caching.
   */
  public static async saveFile(
    userId: number,
    fileType: FileType,
    filename: string,
    contentType: string,
    data: Buffer
  ): Promise<StoredFileData> {
    const safeFilename = path.basename(filename).replace(/[^\w\s.-]/gi, '_');

    // 1. Transactionally remove any older stored records for this user and type
    try {
      await prisma.storedFile.deleteMany({
        where: { user_id: userId, file_type: fileType },
      });
    } catch (err) {
      console.warn(`[FileStorage] Error cleaning previous ${fileType} for user ${userId}:`, err);
    }

    // 2. Persist in database (PostgreSQL / SQLite via Prisma)
    const record = await prisma.storedFile.create({
      data: {
        user_id: userId,
        file_type: fileType,
        filename: safeFilename,
        content_type: contentType,
        file_size: data.length,
        data: data,
      },
    });

    // 3. Mirror to local disk cache (best-effort, non-blocking if disk is read-only)
    try {
      if (!fs.existsSync(this.UPLOAD_DIR)) {
        fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
      }
      // Remove previous files on local disk
      const prefix = `${fileType}_${userId}_`;
      const existing = fs.readdirSync(this.UPLOAD_DIR).filter(f => f.startsWith(prefix));
      for (const f of existing) {
        try { fs.unlinkSync(path.join(this.UPLOAD_DIR, f)); } catch {}
      }

      const ext = safeFilename.split('.').pop() || (fileType === 'avatar' ? 'jpeg' : 'pdf');
      const diskFilename = `${prefix}${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(this.UPLOAD_DIR, diskFilename), data);
    } catch (err) {
      // Local disk write failure is non-fatal since the database is persistent
      console.warn(`[FileStorage] Local disk cache write skipped:`, err);
    }

    return {
      id: record.id,
      filename: record.filename,
      contentType: record.content_type,
      data: Buffer.from(record.data),
      fileSize: record.file_size,
    };
  }

  /**
   * Retrieve a file, checking the persistent database first,
   * with automatic fallback and migration for legacy files on the local filesystem.
   */
  public static async getFile(
    userId: number,
    fileType: FileType
  ): Promise<StoredFileData | null> {
    // 1. Check persistent database
    try {
      const stored = await prisma.storedFile.findFirst({
        where: { user_id: userId, file_type: fileType },
        orderBy: { created_at: 'desc' },
      });

      if (stored) {
        return {
          id: stored.id,
          filename: stored.filename,
          contentType: stored.content_type,
          data: Buffer.from(stored.data),
          fileSize: stored.file_size,
        };
      }
    } catch (err) {
      console.warn(`[FileStorage] Database query failed for ${fileType} user ${userId}:`, err);
    }

    // 2. Fallback to local filesystem for legacy uploads, and auto-migrate to DB
    try {
      if (fs.existsSync(this.UPLOAD_DIR)) {
        const prefix = `${fileType}_${userId}_`;
        const files = fs.readdirSync(this.UPLOAD_DIR).filter(f => f.startsWith(prefix));
        if (files.length > 0) {
          const filePath = path.join(this.UPLOAD_DIR, files[0]);
          const buffer = fs.readFileSync(filePath);
          const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');

          let inferredContentType = 'application/octet-stream';
          if (fileType === 'avatar') {
            inferredContentType = ext === 'png' ? 'image/png' : 'image/jpeg';
          } else {
            inferredContentType = ext === 'docx'
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'application/pdf';
          }

          const legacyName = files[0];

          // Lazily migrate to persistent database so future restarts don't lose it
          try {
            await prisma.storedFile.create({
              data: {
                user_id: userId,
                file_type: fileType,
                filename: legacyName,
                content_type: inferredContentType,
                file_size: buffer.length,
                data: buffer,
              },
            });
            console.log(`[FileStorage] Migrated legacy disk ${fileType} for user ${userId} to persistent storage.`);
          } catch (migrateErr) {
            console.warn(`[FileStorage] Legacy disk migration warning:`, migrateErr);
          }

          return {
            filename: legacyName,
            contentType: inferredContentType,
            data: buffer,
            fileSize: buffer.length,
          };
        }
      }
    } catch (fsErr) {
      console.warn(`[FileStorage] Local disk fallback read failed:`, fsErr);
    }

    return null;
  }

  /**
   * Delete a file from persistent database and local disk.
   */
  public static async deleteFile(userId: number, fileType: FileType): Promise<void> {
    try {
      await prisma.storedFile.deleteMany({
        where: { user_id: userId, file_type: fileType },
      });
    } catch (err) {
      console.warn(`[FileStorage] Error deleting DB record for user ${userId}:`, err);
    }

    try {
      if (fs.existsSync(this.UPLOAD_DIR)) {
        const prefix = `${fileType}_${userId}_`;
        const existing = fs.readdirSync(this.UPLOAD_DIR).filter(f => f.startsWith(prefix));
        for (const f of existing) {
          try { fs.unlinkSync(path.join(this.UPLOAD_DIR, f)); } catch {}
        }
      }
    } catch {}
  }
}
