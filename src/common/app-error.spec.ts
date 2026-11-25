import { HttpStatus } from '@nestjs/common';
import { AppError } from './app-error';

describe('AppError', () => {
  it('mặc định dùng mã trạng thái 400 và giữ code, message trong body', () => {
    const error = new AppError('QT5_VIOLATION', 'Giá bán phải lớn hơn 0');

    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(error.getResponse()).toEqual({
      code: 'QT5_VIOLATION',
      message: 'Giá bán phải lớn hơn 0',
    });
  });

  it('cho phép truyền status và details tùy chọn', () => {
    const error = new AppError(
      'POST_NOT_FOUND',
      'Không tìm thấy tin đăng p99',
      HttpStatus.NOT_FOUND,
      { postId: 'p99' },
    );

    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toEqual({
      code: 'POST_NOT_FOUND',
      message: 'Không tìm thấy tin đăng p99',
      details: { postId: 'p99' },
    });
  });
});
