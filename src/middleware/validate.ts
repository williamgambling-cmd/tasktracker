import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = req[target];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const validated = schema.parse(data);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      req[target] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendError(res, 'Validation failed', 400, errors);
        return;
      }
      next(error);
    }
  };
}

export function validateRequest(config: ValidationConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string }> = [];

    const targets: ValidationTarget[] = ['body', 'query', 'params'];

    for (const target of targets) {
      const schema = config[target];
      if (schema) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const validated = schema.parse(req[target]);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          req[target] = validated;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                field: `${target}.${e.path.join('.')}`,
                message: e.message,
              }))
            );
          }
        }
      }
    }

    if (errors.length > 0) {
      sendError(res, 'Validation failed', 400, errors);
      return;
    }

    next();
  };
}
