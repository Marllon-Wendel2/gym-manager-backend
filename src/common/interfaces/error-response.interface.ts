export interface PrismaError {
  code?: string;
  message: string;
  meta?: Record<string, any>;
}

export interface AppError extends Error {
  response?: {
    message: string;
    statusCode?: number;
  };
}
