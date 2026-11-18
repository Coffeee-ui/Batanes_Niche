import { ErrorReport } from '@prisma/client';
import { ErrorReportRepository } from '../repositories/errorReportRepository';

function sanitizeSensitive(text: string | null | undefined): string | null {
  if (!text) return null;
  return text
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1[REDACTED]$3')
    .replace(/(password|passwd|pwd|secret|token|api[_-]?key)=([^&;\s]+)/gi, '$1=[REDACTED]');
}

export class ErrorLoggingService {
  static async recordError(
    errorMessage: string,
    endpoint?: string | null,
    username?: string | null,
    stackTrace?: string | null,
    requestData?: string | null
  ): Promise<ErrorReport> {
    let sanitizedRequestData = requestData;
    if (requestData) {
      for (const term of ['password', 'token', 'otp', 'secret']) {
        if (requestData.toLowerCase().includes(term)) {
          sanitizedRequestData = '[REDACTED_REQUEST_DATA]';
          break;
        }
      }
    }

    return ErrorReportRepository.create({
      error_message: sanitizeSensitive(errorMessage) || errorMessage,
      endpoint: endpoint || null,
      username: username || null,
      stack_trace: sanitizeSensitive(stackTrace),
      request_data: sanitizedRequestData || null,
    });
  }
}
