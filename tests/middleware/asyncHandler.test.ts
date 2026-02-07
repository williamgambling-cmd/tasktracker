import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../src/middleware/asyncHandler';

function createMocks() {
  const req = {} as Request;
  const res = {} as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('asyncHandler', () => {
  it('should call the wrapped async function', async () => {
    const { req, res, next } = createMocks();
    const fn = jest.fn().mockResolvedValue(undefined);

    const handler = asyncHandler(fn);
    handler(req, res, next);

    // Wait for the promise to resolve
    await new Promise(process.nextTick);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with the error when the async function rejects', async () => {
    const { req, res, next } = createMocks();
    const error = new Error('Async failure');
    const fn = jest.fn().mockRejectedValue(error);

    const handler = asyncHandler(fn);
    handler(req, res, next);

    // Wait for the promise to reject and .catch to fire
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should call next with the error when the async function throws', async () => {
    const { req, res, next } = createMocks();
    const error = new Error('Thrown error');
    const fn = jest.fn().mockImplementation(async () => {
      throw error;
    });

    const handler = asyncHandler(fn);
    handler(req, res, next);

    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should return a function', () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);
    expect(typeof handler).toBe('function');
  });

  it('should not call next when the async function resolves successfully', async () => {
    const { req, res, next } = createMocks();
    const fn = jest.fn().mockImplementation(async (_req: Request, _res: Response) => {
      // simulating some async work
      await Promise.resolve();
    });

    const handler = asyncHandler(fn);
    handler(req, res, next);

    await new Promise(process.nextTick);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle non-Error rejection values', async () => {
    const { req, res, next } = createMocks();
    const fn = jest.fn().mockRejectedValue('string error');

    const handler = asyncHandler(fn);
    handler(req, res, next);

    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith('string error');
  });
});
