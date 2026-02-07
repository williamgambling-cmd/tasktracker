import { Response } from 'express';
import { sendSuccess, sendCreated, sendNoContent, sendError } from '../../src/utils/response';

function createMockResponse() {
  const jsonFn = jest.fn();
  const sendFn = jest.fn();
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn, send: sendFn });

  const res = {
    status: statusFn,
    json: jsonFn,
    send: sendFn,
  } as unknown as Response;

  return { res, statusFn, jsonFn, sendFn };
}

describe('sendSuccess', () => {
  it('should send 200 status with data by default', () => {
    const { res, statusFn, jsonFn } = createMockResponse();
    const data = { id: 1, name: 'Test Task' };

    sendSuccess(res, data);

    expect(statusFn).toHaveBeenCalledWith(200);
    expect(jsonFn).toHaveBeenCalledWith({
      success: true,
      message: undefined,
      data: { id: 1, name: 'Test Task' },
    });
  });

  it('should include message when provided', () => {
    const { res, statusFn, jsonFn } = createMockResponse();
    const data = { id: 1 };

    sendSuccess(res, data, 'Task retrieved successfully');

    expect(statusFn).toHaveBeenCalledWith(200);
    expect(jsonFn).toHaveBeenCalledWith({
      success: true,
      message: 'Task retrieved successfully',
      data: { id: 1 },
    });
  });

  it('should allow custom status code', () => {
    const { res, statusFn, jsonFn } = createMockResponse();

    sendSuccess(res, { ok: true }, 'Accepted', 202);

    expect(statusFn).toHaveBeenCalledWith(202);
    expect(jsonFn).toHaveBeenCalledWith({
      success: true,
      message: 'Accepted',
      data: { ok: true },
    });
  });

  it('should handle null data', () => {
    const { res, statusFn, jsonFn } = createMockResponse();

    sendSuccess(res, null);

    expect(statusFn).toHaveBeenCalledWith(200);
    expect(jsonFn).toHaveBeenCalledWith({
      success: true,
      message: undefined,
      data: null,
    });
  });

  it('should handle array data', () => {
    const { res, statusFn, jsonFn } = createMockResponse();
    const data = [{ id: 1 }, { id: 2 }];

    sendSuccess(res, data, 'Tasks retrieved');

    expect(statusFn).toHaveBeenCalledWith(200);
    expect(jsonFn).toHaveBeenCalledWith({
      success: true,
      message: 'Tasks retrieved',
      data: [{ id: 1 }, { id: 2 }],
    });
  });
});

describe('sendCreated', () => {
  it('should send 201 status with data', () => {
    const { res, statusFn, jsonFn } = createMockResponse();
    const data = { id: 1, title: 'New Task' };

    sendCreated(res, data);

    expect(statusFn).toHaveBeenCalledWith(201);
    expect(jsonFn).toHaveBeenCalledWith({
      success: true,
      message: undefined,
      data: { id: 1, title: 'New Task' },
    });
  });

  it('should include message when provided', () => {
    const { res, statusFn, jsonFn } = createMockResponse();
    const data = { id: 1 };

    sendCreated(res, data, 'Task created');

    expect(statusFn).toHaveBeenCalledWith(201);
    expect(jsonFn).toHaveBeenCalledWith({
      success: true,
      message: 'Task created',
      data: { id: 1 },
    });
  });
});

describe('sendNoContent', () => {
  it('should send 204 status with no body', () => {
    const { res, statusFn, sendFn } = createMockResponse();

    sendNoContent(res);

    expect(statusFn).toHaveBeenCalledWith(204);
    expect(sendFn).toHaveBeenCalledWith();
  });
});

describe('sendError', () => {
  it('should send 400 status by default with error message', () => {
    const { res, statusFn, jsonFn } = createMockResponse();

    sendError(res, 'Bad request');

    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith({
      success: false,
      error: 'Bad request',
      errors: undefined,
    });
  });

  it('should allow custom status code', () => {
    const { res, statusFn, jsonFn } = createMockResponse();

    sendError(res, 'Not found', 404);

    expect(statusFn).toHaveBeenCalledWith(404);
    expect(jsonFn).toHaveBeenCalledWith({
      success: false,
      error: 'Not found',
      errors: undefined,
    });
  });

  it('should include field-level errors when provided', () => {
    const { res, statusFn, jsonFn } = createMockResponse();
    const errors = [
      { field: 'email', message: 'Invalid email' },
      { field: 'password', message: 'Too short' },
    ];

    sendError(res, 'Validation failed', 400, errors);

    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed',
      errors: [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ],
    });
  });

  it('should send 500 when specified', () => {
    const { res, statusFn, jsonFn } = createMockResponse();

    sendError(res, 'Internal server error', 500);

    expect(statusFn).toHaveBeenCalledWith(500);
    expect(jsonFn).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
      errors: undefined,
    });
  });
});
