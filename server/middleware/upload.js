import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_PHOTO_MB = 10;

// memoryStorage: the photo only ever lives in RAM (req.file.buffer). It's forwarded to the
// AI service and then dropped when the request ends. Never saved to disk, DB or cloud.
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_MB * 1024 * 1024, files: 1, fields: 10 },
  fileFilter: (_req, file, done) => {
    if (ALLOWED_TYPES.has(file.mimetype)) done(null, true);
    else done(ApiError.badRequest('Please upload a JPEG, PNG or WEBP photo.'));
  },
});

// Accepts one photo in the given form field and requires it to be present
export function singlePhoto(field) {
  const handler = photoUpload.single(field);
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return next(
          err.code === 'LIMIT_FILE_SIZE'
            ? ApiError.badRequest(`The photo must be smaller than ${MAX_PHOTO_MB} MB.`)
            : ApiError.badRequest(`Upload problem: ${err.message}`),
        );
      }
      if (err) return next(err);
      if (!req.file) return next(ApiError.badRequest(`Please attach a photo (field "${field}").`));
      next();
    });
  };
}
