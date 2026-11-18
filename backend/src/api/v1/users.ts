import { Router, Response, NextFunction } from 'express';
import { UserService } from '../../services/userService';
import { AuthenticatedRequest, requireAuthenticated } from '../deps';
import { UserProfileUpdateSchema } from '../../schemas/user';
import { HttpError } from '../../core/errors';

export const usersRouter = Router();

// GET /profile
usersRouter.get(
  '/profile',
  requireAuthenticated,
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const profile = UserService.getPrivateProfile(req.user!);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /profile
usersRouter.put(
  '/profile',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updateData = UserProfileUpdateSchema.parse(req.body);
      const updated = await UserService.updateProfile(req.user!, updateData);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// GET /job-seekers
usersRouter.get(
  '/job-seekers',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user!.role !== 'employer') {
        throw new HttpError(403, 'Candidate directory is accessible only to employers.');
      }

      const municipality = (req.query.municipality as string) || null;
      const island = (req.query.island as string) || null;
      const skill = (req.query.skill as string) || null;
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

      const candidates = await UserService.searchJobSeekers(municipality, island, skill, limit, offset);
      res.status(200).json(candidates);
    } catch (err) {
      next(err);
    }
  }
);

import fs from 'fs';
import path from 'path';
import { prisma } from '../../database/client';
import { settings } from '../../core/config';

// ARCHITECTURAL NOTE: Resume files are stored on the local filesystem under
// `uploads/resumes/`. On Render's free tier the filesystem is ephemeral —
// files are permanently lost on each redeploy. For production resilience,
// migrate to object storage (e.g., Supabase Storage, S3, Cloudflare R2).
// Until then, a warning is emitted at startup when running in production mode.
const UPLOAD_DIR = settings.UPLOAD_DIR;

if (settings.DB_PROVIDER === 'postgresql' || settings.ENVIRONMENT.toLowerCase() === 'production') {
  console.warn(
    '[Resume Upload] WARNING: Resume files are stored on the local filesystem. ' +
    'On Render (and most cloud platforms) the filesystem is ephemeral — uploaded ' +
    'files will be lost on every redeploy. Migrate to object storage for production.'
  );
}

function parseMultipartFile(buffer: Buffer, boundary: string): { filename: string; contentType: string; data: Buffer } | null {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = buffer.indexOf(boundaryBuffer);
  if (start === -1) return null;

  start += boundaryBuffer.length + 2;
  const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), start);
  if (headerEnd === -1) return null;

  const headerStr = buffer.slice(start, headerEnd).toString('utf8');
  const filenameMatch = headerStr.match(/filename="([^"]+)"/);
  const contentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);

  const filename = filenameMatch ? filenameMatch[1] : 'resume.pdf';
  const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/pdf';

  const fileDataStart = headerEnd + 4;
  const nextBoundary = buffer.indexOf(boundaryBuffer, fileDataStart);
  if (nextBoundary === -1) return null;

  const fileDataEnd = nextBoundary - 2;
  const fileData = buffer.slice(fileDataStart, fileDataEnd > fileDataStart ? fileDataEnd : fileDataStart);

  return { filename, contentType, data: fileData };
}

// POST /resume (upload resume PDF/DOCX)
usersRouter.post(
  '/resume',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;

      const chunks: Buffer[] = [];
      req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      req.on('end', async () => {
        try {
          const bodyBuffer = Buffer.concat(chunks);
          let fileData: Buffer;
          let filename = 'resume.pdf';

          if (boundary) {
            const parsed = parseMultipartFile(bodyBuffer, boundary);
            if (!parsed || parsed.data.length === 0) {
              res.status(400).json({ message: 'No file uploaded or invalid multipart data.' });
              return;
            }
            fileData = parsed.data;
            filename = parsed.filename;
          } else {
            fileData = bodyBuffer;
          }

          if (fileData.length > 5 * 1024 * 1024) {
            res.status(400).json({ message: 'Resume file must be 5 MB or less.' });
            return;
          }

          const ext = filename.split('.').pop()?.toLowerCase();
          if (ext !== 'pdf' && ext !== 'docx') {
            res.status(400).json({ message: 'Only PDF and DOCX files are allowed.' });
            return;
          }

          // Verify file signature / magic bytes (SEC-01 / FEAT-01)
          const isPdf = fileData.length >= 4 && fileData[0] === 0x25 && fileData[1] === 0x50 && fileData[2] === 0x44 && fileData[3] === 0x46; // %PDF
          const isDocx = fileData.length >= 2 && fileData[0] === 0x50 && fileData[1] === 0x4B; // PK (ZIP container)
          if ((ext === 'pdf' && !isPdf) || (ext === 'docx' && !isDocx)) {
            res.status(400).json({ message: 'File contents do not match the expected PDF or DOCX format.' });
            return;
          }

          fs.mkdirSync(UPLOAD_DIR, { recursive: true });

          // Remove any existing resume files for this user
          const existing = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith(`resume_${req.user!.id}_`));
          for (const f of existing) {
            try { fs.unlinkSync(path.join(UPLOAD_DIR, f)); } catch {}
          }

          const savedFilename = `resume_${req.user!.id}_${Date.now()}.${ext}`;
          fs.writeFileSync(path.join(UPLOAD_DIR, savedFilename), fileData);

          const resumeUrl = `/api/v1/users/resume/${req.user!.id}`;
          await UserService.updateProfile(req.user!, { resume_url: resumeUrl });

          res.status(200).json({ resume_url: resumeUrl, filename });
        } catch (err) {
          next(err);
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /resume (delete own resume)
usersRouter.delete(
  '/resume',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (fs.existsSync(UPLOAD_DIR)) {
        const existing = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith(`resume_${req.user!.id}_`));
        for (const f of existing) {
          try { fs.unlinkSync(path.join(UPLOAD_DIR, f)); } catch {}
        }
      }

      await UserService.updateProfile(req.user!, { resume_url: null });
      res.status(200).json({ message: 'Resume deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /resume and GET /resume/:userId (download resume)
usersRouter.get(
  ['/resume', '/resume/:userId'],
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = req.params.userId ? parseInt(req.params.userId, 10) : req.user!.id;
      if (isNaN(targetUserId)) {
        res.status(400).json({ message: 'Invalid user ID.' });
        return;
      }

      // Access control: only owner, admin, or an employer reviewing an applicant can view resume
      if (targetUserId !== req.user!.id && req.user!.role !== 'admin') {
        if (req.user!.role !== 'employer') {
          res.status(403).json({ message: 'Access denied.' });
          return;
        }

        const hasApplication = await prisma.application.findFirst({
          where: {
            seeker_id: targetUserId,
            job: { employer_id: req.user!.id },
          },
        });

        if (!hasApplication) {
          res.status(403).json({
            message: 'Access denied. You can only view resumes of candidates who applied to your jobs.',
          });
          return;
        }
      }

      if (fs.existsSync(UPLOAD_DIR)) {
        const files = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith(`resume_${targetUserId}_`));
        if (files.length > 0) {
          const filePath = path.join(UPLOAD_DIR, files[0]);
          res.sendFile(filePath);
          return;
        }
      }

      res.status(404).json({ message: 'Resume file not found.' });
    } catch (err) {
      next(err);
    }
  }
);