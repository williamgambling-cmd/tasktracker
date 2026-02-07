import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateRequest } from '../../src/middleware/validate';

function createMocks(overrides: Partial<Request> = {}) {
  const req = {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as unknown as Request;

  const jsonFn = jest.fn();
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn });
  const res = {
    status: statusFn,
    json: jsonFn,
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, statusFn, jsonFn, next };
}

describe('validate', () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  it('should call next() when body validation passes', () => {
    const { req, res, next } = createMocks({
      body: { email: 'test@example.com', password: 'password123' },
    } as Partial<Request>);

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ email: 'test@example.com', password: 'password123' });
  });

  it('should return 400 with validation errors when body is invalid', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks({
      body: { email: 'not-an-email', password: '123' },
    } as Partial<Request>);

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
        ]),
      })
    );
  });

  it('should validate query params when target is "query"', () => {
    const querySchema = z.object({
      page: z.string(),
      limit: z.string(),
    });
    const { req, res, next } = createMocks({
      query: { page: '1', limit: '10' },
    } as Partial<Request>);

    const middleware = validate(querySchema, 'query');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should validate route params when target is "params"', () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });
    const { req, res, statusFn, next } = createMocks({
      params: { id: 'not-a-uuid' },
    } as Partial<Request>);

    const middleware = validate(paramsSchema, 'params');
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(400);
  });

  it('should call next with error for non-Zod errors', () => {
    // Create a schema that throws a non-Zod error
    const badSchema = {
      parse: () => {
        throw new Error('Unexpected error');
      },
    } as unknown as z.ZodSchema;

    const { req, res, next } = createMocks({
      body: { anything: true },
    } as Partial<Request>);

    const middleware = validate(badSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect((next as jest.Mock).mock.calls[0][0].message).toBe('Unexpected error');
  });

  it('should strip unknown fields from validated data', () => {
    const strictSchema = z.object({
      name: z.string(),
    });
    const { req, res, next } = createMocks({
      body: { name: 'Test', extraField: 'should be stripped' },
    } as Partial<Request>);

    const middleware = validate(strictSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    // Zod strips unknown keys by default
    expect(req.body).toEqual({ name: 'Test' });
  });
});

describe('validateRequest', () => {
  it('should call next() when all validations pass', () => {
    const config = {
      body: z.object({ title: z.string() }),
      query: z.object({ page: z.string().optional() }),
    };
    const { req, res, next } = createMocks({
      body: { title: 'My Task' },
      query: { page: '1' },
    } as Partial<Request>);

    const middleware = validateRequest(config);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should return 400 with errors from body validation failure', () => {
    const config = {
      body: z.object({ title: z.string().min(1) }),
    };
    const { req, res, statusFn, jsonFn, next } = createMocks({
      body: { title: 123 },
    } as Partial<Request>);

    const middleware = validateRequest(config);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining('body.'),
          }),
        ]),
      })
    );
  });

  it('should return 400 with errors from query validation failure', () => {
    const config = {
      query: z.object({ page: z.string().regex(/^\d+$/) }),
    };
    const { req, res, statusFn, jsonFn, next } = createMocks({
      query: { page: 'abc' },
    } as Partial<Request>);

    const middleware = validateRequest(config);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(400);
    const response = jsonFn.mock.calls[0][0];
    expect(response.errors[0].field).toMatch(/^query\./);
  });

  it('should return 400 with errors from params validation failure', () => {
    const config = {
      params: z.object({ id: z.string().uuid() }),
    };
    const { req, res, statusFn, jsonFn, next } = createMocks({
      params: { id: 'not-a-uuid' },
    } as Partial<Request>);

    const middleware = validateRequest(config);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(400);
    const response = jsonFn.mock.calls[0][0];
    expect(response.errors[0].field).toMatch(/^params\./);
  });

  it('should aggregate errors from multiple targets', () => {
    const config = {
      body: z.object({ title: z.string() }),
      params: z.object({ id: z.string().uuid() }),
    };
    const { req, res, statusFn, jsonFn, next } = createMocks({
      body: { title: 123 },
      params: { id: 'bad-id' },
    } as Partial<Request>);

    const middleware = validateRequest(config);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusFn).toHaveBeenCalledWith(400);
    const response = jsonFn.mock.calls[0][0];
    const fields = response.errors.map((e: { field: string }) => e.field);
    expect(fields.some((f: string) => f.startsWith('body.'))).toBe(true);
    expect(fields.some((f: string) => f.startsWith('params.'))).toBe(true);
  });

  it('should pass through when config has no schemas', () => {
    const config = {};
    const { req, res, next } = createMocks();

    const middleware = validateRequest(config);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should update req values with parsed/transformed data', () => {
    const config = {
      body: z.object({ count: z.number() }),
      query: z.object({ active: z.string().optional() }),
    };
    const { req, res, next } = createMocks({
      body: { count: 5, extra: 'removed' },
      query: { active: 'true' },
    } as Partial<Request>);

    const middleware = validateRequest(config);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ count: 5 });
    expect(req.query).toEqual({ active: 'true' });
  });
});
