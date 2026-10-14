import { ErrorReport } from '@prisma/client';
import { ErrorReportRepository } from '../repositories/errorReportRepository';

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
      error_message: errorMessage,
      endpoint: endpoint || null,
      username: username || null,
      stack_trace: stackTrace || null,
      request_data: sanitizedRequestData || null,
    });
  }
}
