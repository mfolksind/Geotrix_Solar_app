export type ApiBody<T> = {
  success: boolean;
  message: string;
  data?: T | null;
  errors: unknown[];
};

export type ApiResult<T> = {
  statusCode: number;
  body: ApiBody<T>;
};

export function success<T = unknown>(data: T, message = 'OK'): ApiResult<T> {
  return {
    statusCode: 200,
    body: { success: true, message, data, errors: [] },
  };
}

export function created<T = unknown>(data: T, message = 'Created'): ApiResult<T> {
  return {
    statusCode: 201,
    body: { success: true, message, data, errors: [] },
  };
}

export function badRequest(message = 'Bad request', errors: unknown[] = []): ApiResult<null> {
  return {
    statusCode: 400,
    body: { success: false, message, data: null, errors },
  };
}

export function unauthorized(message = 'Unauthorized', errors: unknown[] = []): ApiResult<null> {
  return {
    statusCode: 401,
    body: { success: false, message, data: null, errors },
  };
}

export function forbidden(message = 'Forbidden', errors: unknown[] = []): ApiResult<null> {
  return {
    statusCode: 403,
    body: { success: false, message, data: null, errors },
  };
}

export function notFound(message = 'Not found', errors: unknown[] = []): ApiResult<null> {
  return {
    statusCode: 404,
    body: { success: false, message, data: null, errors },
  };
}

export function serverError(message = 'Internal server error', errors: unknown[] = []): ApiResult<null> {
  return {
    statusCode: 500,
    body: { success: false, message, data: null, errors },
  };
}

export default {
  success,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
};
