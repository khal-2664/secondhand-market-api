import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { AppError } from './app-error';

function createHttpHost(method = 'GET', url = '/v1/test') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const req = { method, url };
  const res = { status };

  const host = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('chuẩn hóa AppError với mã nghiệp vụ và ghi log warn', () => {
    const { host, status, json } = createHttpHost('GET', '/v1/posts/p99');
    const error = new AppError(
      'POST_NOT_FOUND',
      'Không tìm thấy tin đăng p99',
      HttpStatus.NOT_FOUND,
    );

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: 'POST_NOT_FOUND',
      message: 'Không tìm thấy tin đăng p99',
      path: '/v1/posts/p99',
      timestamp: expect.any(String),
    });
    expect(warnSpy).toHaveBeenCalledWith(
      'GET /v1/posts/p99 -> 404 POST_NOT_FOUND',
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('chuẩn hóa lỗi Nest có mảng message, không lặp body mặc định vào details', () => {
    const { host, status, json } = createHttpHost('POST', '/v1/posts');
    const error = new BadRequestException([
      'title không được để trống',
      'price phải dương',
    ]);

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: 'BAD_REQUEST',
      message: 'title không được để trống; price phải dương',
      path: '/v1/posts',
      timestamp: expect.any(String),
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('không gán details khi lỗi Nest chỉ có message, error, statusCode', () => {
    const { host, status, json } = createHttpHost('GET', '/settings');
    const error = new NotFoundException('Cannot GET /settings');

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: 'NOT_FOUND',
      message: 'Cannot GET /settings',
      path: '/settings',
      timestamp: expect.any(String),
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('giữ cây kết quả Terminus vào details và ẩn message khi trả 503', () => {
    const { host, status, json } = createHttpHost('GET', '/v1/health');
    const terminusBody = {
      status: 'error',
      info: {},
      error: { database: { status: 'down' } },
      details: { database: { status: 'down' } },
    };
    const error = new ServiceUnavailableException(terminusBody);

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Lỗi hệ thống, vui lòng thử lại sau',
      details: terminusBody,
      path: '/v1/health',
      timestamp: expect.any(String),
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('ẩn thông điệp nội bộ của Error thường và ghi log error kèm stack', () => {
    const { host, status, json } = createHttpHost('GET', '/v1/boom');
    const error = new Error('bí mật nội bộ');

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi hệ thống, vui lòng thử lại sau',
      path: '/v1/boom',
      timestamp: expect.any(String),
    });
    expect(errorSpy).toHaveBeenCalledWith(
      'GET /v1/boom -> 500 INTERNAL_SERVER_ERROR',
      error.stack,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
