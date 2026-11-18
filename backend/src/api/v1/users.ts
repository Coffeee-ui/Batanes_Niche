import { Router, Response, NextFunction } from 'express';
import path from 'path';
import { UserService } from '../../services/userService';
import { UserRepository } from '../../repositories/userRepository';
import { AuthenticatedRequest, requireAuthenticated } from '../deps';
import { UserProfileUpdateSchema } from '../../schemas/user';
import { HttpError } from '../../core/errors';
import { prisma } from '../../database/client';
import { FileStorageService } from '../../services/fileStorageService';

export const usersRouter = Router();

function parseMultipartFile(
  buffer: Buffer,
  boundary: string
): { filename: string; contentType: string; data: Buffer } | null {
  const cleanBoundary = boundary.replace(/^--/, '').trim();
  const boundaryBuffer = Buffer.from(`--${cleanBoundary}`);
  let start = buffer.indexOf(boundaryBuffer);
  if (start === -1) return null;

  start += boundaryBuffer.length;
  // Skip CRLF or LF after boundary
  if (buffer[start] === 0x0D && buffer[start + 1] === 0x0A) {
    start += 2;
  } else if (buffer[start] === 0x0A) {
    start += 1;
  }

  const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), start);
  let fileDataStart = -1;
  let headerStr = '';

  if (headerEnd !== -1) {
    headerStr = buffer.slice(start, headerEnd).toString('utf8');
    fileDataStart = headerEnd + 4;
  } else {
    const lfEnd = buffer.indexOf(Buffer.from('\n\n'), start);
    if (lfEnd !== -1) {
      headerStr = buffer.slice(start, lfEnd).toString('utf8');
      fileDataStart = lfEnd + 2;
    } else {
      return null;
    }
  }

  const filenameMatch = headerStr.match(/filename="?([^"\r\n]+)"?/i);
  const contentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n;]+)/i);

  const filename = filenameMatch ? path.basename(filenameMatch[1].trim()) : 'upload.bin';
  const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';

  const nextBoundary = buffer.indexOf(boundaryBuffer, fileDataStart);
  if (nextBoundary === -1) return null;

  let fileDataEnd = nextBoundary;
  if (fileDataEnd >= fileDataStart + 2 && buffer[fileDataEnd - 2] === 0x0D && buffer[fileDataEnd - 1] === 0x0A) {
    fileDataEnd -= 2;
  } else if (fileDataEnd >= fileDataStart + 1 && buffer[fileDataEnd - 1] === 0x0A) {
    fileDataEnd -= 1;
  }

  const fileData = buffer.slice(fileDataStart, fileDataEnd > fileDataStart ? fileDataEnd : fileDataStart);

  return { filename, contentType, data: fileData };
}

// GET /profile (current user profile)
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

// PUT /profile (update profile)
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

// GET /employers (public employer directory)
usersRouter.get(
  '/employers',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const company = (req.query.company as string) || (req.query.q as string) || null;
      const industry = (req.query.industry as string) || null;
      const municipality = (req.query.municipality as string) || null;
      const hasActiveVacancies = req.query.has_vacancies === 'true';
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

      const employers = await UserService.searchEmployers(company, industry, municipality, hasActiveVacancies, limit, offset);
      res.status(200).json(employers);
    } catch (err) {
      next(err);
    }
  }
);

// GET /employers/:id (public employer profile)
usersRouter.get(
  '/employers/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new HttpError(404, 'Employer not found.');
      }
      const profile = await UserService.getEmployerProfile(id);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }
);

// GET /job-seekers (candidate discovery for employers)
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
      const education = (req.query.education as string) || null;
      const experienceYears = req.query.experience_years ? parseInt(req.query.experience_years as string, 10) : null;
      const desiredEmploymentType = (req.query.desired_employment_type as string) || null;
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

      const candidates = await UserService.searchJobSeekers(
        municipality,
        island,
        skill,
        education,
        experienceYears,
        desiredEmploymentType,
        limit,
        offset
      );
      res.status(200).json(candidates);
    } catch (err) {
      next(err);
    }
  }
);

// POST /candidates/save/:candidateId (save candidate - employer only)
usersRouter.post(
  '/candidates/save/:candidateId',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user!.role !== 'employer') {
        throw new HttpError(403, 'Only employers can save candidates.');
      }
      const candidateId = parseInt(req.params.candidateId, 10);
      if (isNaN(candidateId)) {
        throw new HttpError(400, 'Invalid candidate ID.');
      }
      await UserRepository.saveCandidate(req.user!.id, candidateId);
      res.status(200).json({ message: 'Candidate saved successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /candidates/save/:candidateId (remove saved candidate)
usersRouter.delete(
  '/candidates/save/:candidateId',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user!.role !== 'employer') {
        throw new HttpError(403, 'Only employers can manage saved candidates.');
      }
      const candidateId = parseInt(req.params.candidateId, 10);
      if (isNaN(candidateId)) {
        throw new HttpError(400, 'Invalid candidate ID.');
      }
      await UserRepository.removeSavedCandidate(req.user!.id, candidateId);
      res.status(200).json({ message: 'Candidate removed from saved list.' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /candidates/saved (list saved candidates)
usersRouter.get(
  '/candidates/saved',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user!.role !== 'employer') {
        throw new HttpError(403, 'Only employers can view saved candidates.');
      }
      const saved = await UserRepository.listSavedCandidates(req.user!.id);
      res.status(200).json(saved);
    } catch (err) {
      next(err);
    }
  }
);

// POST /follow/:employerId (follow employer - job seeker only)
usersRouter.post(
  '/follow/:employerId',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user!.role !== 'job_seeker') {
        throw new HttpError(403, 'Only job seekers can follow employers.');
      }
      const employerId = parseInt(req.params.employerId, 10);
      if (isNaN(employerId)) {
        throw new HttpError(400, 'Invalid employer ID.');
      }
      await UserRepository.followEmployer(req.user!.id, employerId);
      res.status(200).json({ message: 'Employer followed successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /follow/:employerId (unfollow employer)
usersRouter.delete(
  '/follow/:employerId',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user!.role !== 'job_seeker') {
        throw new HttpError(403, 'Only job seekers can unfollow employers.');
      }
      const employerId = parseInt(req.params.employerId, 10);
      if (isNaN(employerId)) {
        throw new HttpError(400, 'Invalid employer ID.');
      }
      await UserRepository.unfollowEmployer(req.user!.id, employerId);
      res.status(200).json({ message: 'Employer unfollowed successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /followed-employers (list followed employers)
usersRouter.get(
  '/followed-employers',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user!.role !== 'job_seeker') {
        throw new HttpError(403, 'Only job seekers can view followed employers.');
      }
      const list = await UserRepository.listFollowedEmployers(req.user!.id);
      res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  }
);

// GET /is-following/:employerId (check follow status)
usersRouter.get(
  '/is-following/:employerId',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employerId = parseInt(req.params.employerId, 10);
      if (isNaN(employerId)) {
        throw new HttpError(400, 'Invalid employer ID.');
      }
      const isFollowing = await UserRepository.isFollowingEmployer(req.user!.id, employerId);
      res.status(200).json({ is_following: isFollowing });
    } catch (err) {
      next(err);
    }
  }
);

// POST /change-password
usersRouter.post(
  '/change-password',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) {
        throw new HttpError(400, 'Current and new password are required.');
      }
      if (new_password.length < 8) {
        throw new HttpError(400, 'New password must be at least 8 characters long.');
      }
      await UserService.changePassword(req.user!, current_password, new_password);
      res.status(200).json({ message: 'Password changed successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /deactivate
usersRouter.post(
  '/deactivate',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await UserService.deactivateAccount(req.user!);
      res.status(200).json({ message: 'Account deactivated successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /reactivate (public endpoint with email/password)
usersRouter.post(
  '/reactivate',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email_or_username, password } = req.body;
      if (!email_or_username || !password) {
        throw new HttpError(400, 'Credentials required.');
      }
      const user = await UserService.reactivateAccount(email_or_username, password);
      res.status(200).json({ message: 'Account reactivated successfully.', user_id: user.id });
    } catch (err) {
      next(err);
    }
  }
);

// POST /request-deletion
usersRouter.post(
  '/request-deletion',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password } = req.body;
      if (!password) {
        throw new HttpError(400, 'Password confirmation is required.');
      }
      await UserService.requestPermanentDeletion(req.user!, password);
      res.status(200).json({ message: 'Permanent deletion request registered.' });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /discoverability
usersRouter.patch(
  '/discoverability',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isDiscoverable = Boolean(req.body.is_discoverable);
      await UserService.updateProfile(req.user!, { is_discoverable: isDiscoverable });
      res.status(200).json({ is_discoverable: isDiscoverable });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /notification-preferences
usersRouter.patch(
  '/notification-preferences',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prefs = req.body.notification_preferences;
      if (typeof prefs !== 'object') {
        throw new HttpError(400, 'Invalid notification preferences.');
      }
      await UserService.updateProfile(req.user!, {
        notification_preferences: JSON.stringify(prefs),
      });
      res.status(200).json({ notification_preferences: prefs });
    } catch (err) {
      next(err);
    }
  }
);

// POST /report (report user or vacancy)
usersRouter.post(
  '/report',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { target_type, target_id, reason, details } = req.body;
      if (!target_type || target_id === undefined || !reason) {
        throw new HttpError(400, 'Target type, target ID, and reason are required.');
      }
      const tId = parseInt(String(target_id), 10);
      if (isNaN(tId)) {
        throw new HttpError(400, 'Target ID must be a valid number.');
      }
      const report = await UserRepository.createReport(
        req.user!.id,
        String(target_type),
        tId,
        String(reason),
        details || null
      );
      res.status(201).json({ message: 'Report submitted successfully.', report_id: report.id });
    } catch (err) {
      next(err);
    }
  }
);

// POST /resume (upload resume PDF/DOCX - up to 10MB)
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

          // 10 MB maximum per specification
          if (fileData.length > 10 * 1024 * 1024) {
            res.status(400).json({ message: 'CV file must be 10 MB or less.' });
            return;
          }

          const ext = filename.split('.').pop()?.toLowerCase();
          if (ext !== 'pdf' && ext !== 'docx') {
            res.status(400).json({ message: 'Only PDF and DOCX files are allowed.' });
            return;
          }

          // Verify file signature / magic bytes (PDF: %PDF, DOCX: PK ZIP container)
          const isPdf = fileData.length >= 4 && fileData[0] === 0x25 && fileData[1] === 0x50 && fileData[2] === 0x44 && fileData[3] === 0x46;
          const isDocx = fileData.length >= 2 && fileData[0] === 0x50 && fileData[1] === 0x4B;
          if ((ext === 'pdf' && !isPdf) || (ext === 'docx' && !isDocx)) {
            res.status(400).json({ message: 'File contents do not match the expected PDF or DOCX format.' });
            return;
          }

          const mimeType = ext === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

          // Store persistently in PostgreSQL database (survives Render restarts)
          const stored = await FileStorageService.saveFile(
            req.user!.id,
            'resume',
            filename,
            mimeType,
            fileData
          );

          const resumeUrl = `/api/v1/users/resume/${req.user!.id}`;
          await UserService.updateProfile(req.user!, { resume_url: resumeUrl });

          res.status(200).json({ resume_url: resumeUrl, filename: stored.filename });
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
      await FileStorageService.deleteFile(req.user!.id, 'resume');
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

      const file = await FileStorageService.getFile(targetUserId, 'resume');
      if (!file) {
        res.status(404).json({ message: 'Resume file not found.' });
        return;
      }

      const safeAsciiFilename = file.filename.replace(/["\r\n]/g, '').replace(/[^\x20-\x7E]/g, '_');
      const safeUtf8Filename = encodeURIComponent(file.filename);

      res.setHeader('Content-Type', file.contentType || 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeAsciiFilename}"; filename*=UTF-8''${safeUtf8Filename}`
      );
      res.setHeader('Content-Length', file.fileSize);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(file.data);
    } catch (err) {
      next(err);
    }
  }
);

// POST /profile-picture (upload JPEG/PNG up to 5MB)
usersRouter.post(
  '/profile-picture',
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
          let filename = 'avatar.png';

          if (boundary) {
            const parsed = parseMultipartFile(bodyBuffer, boundary);
            if (!parsed || parsed.data.length === 0) {
              res.status(400).json({ message: 'No image uploaded or invalid multipart data.' });
              return;
            }
            fileData = parsed.data;
            filename = parsed.filename;
          } else {
            fileData = bodyBuffer;
          }

          // 5 MB maximum per specification
          if (fileData.length > 5 * 1024 * 1024) {
            res.status(400).json({ message: 'Profile picture must be 5 MB or less.' });
            return;
          }

          const ext = filename.split('.').pop()?.toLowerCase();
          if (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') {
            res.status(400).json({ message: 'Only JPEG and PNG images are allowed.' });
            return;
          }

          // Verify magic bytes (JPEG: FF D8 FF, PNG: 89 50 4E 47)
          const isJpeg = fileData.length >= 3 && fileData[0] === 0xFF && fileData[1] === 0xD8 && fileData[2] === 0xFF;
          const isPng = fileData.length >= 4 && fileData[0] === 0x89 && fileData[1] === 0x50 && fileData[2] === 0x4E && fileData[3] === 0x47;
          if (!isJpeg && !isPng) {
            res.status(400).json({ message: 'File contents do not match the expected JPEG or PNG image format.' });
            return;
          }

          const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

          // Store persistently in PostgreSQL database (survives Render restarts)
          await FileStorageService.saveFile(
            req.user!.id,
            'avatar',
            `avatar_${req.user!.id}.${ext === 'jpg' ? 'jpeg' : ext}`,
            mimeType,
            fileData
          );

          // Append timestamp version for instant cache invalidation upon photo replacement
          const avatarUrl = `/api/v1/users/avatar/${req.user!.id}?v=${Date.now()}`;
          await UserService.updateProfile(req.user!, { profile_pic: avatarUrl });

          res.status(200).json({ profile_pic: avatarUrl });
        } catch (err) {
          next(err);
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /avatar/:userId (public avatar download)
usersRouter.get(
  '/avatar/:userId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = parseInt(req.params.userId, 10);
      if (isNaN(targetUserId)) {
        res.status(400).json({ message: 'Invalid user ID.' });
        return;
      }

      const file = await FileStorageService.getFile(targetUserId, 'avatar');
      if (!file) {
        res.status(404).json({ message: 'Avatar image not found.' });
        return;
      }

      res.setHeader('Content-Type', file.contentType || 'image/jpeg');
      res.setHeader('Content-Length', file.fileSize);
      res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(file.data);
    } catch (err) {
      next(err);
    }
  }
);
