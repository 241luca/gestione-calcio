export class ResponseFormatter {
  static success<T>(data: T, meta?: any) {
    return {
      success: true,
      data,
      ...(meta && { meta })
    };
  }

  static error(
    code: string,
    message: string,
    details?: any,
    field?: string
  ) {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
        ...(field && { field })
      }
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ) {
    return {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  static validationError(errors: any[]) {
    return this.error(
      'VALIDATION_ERROR',
      'I dati inseriti non sono validi',
      errors,
      errors[0]?.field
    );
  }
}
