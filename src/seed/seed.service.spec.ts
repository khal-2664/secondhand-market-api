import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { DEFAULT_CATEGORIES } from './default-categories';
import { SeedService } from './seed.service';

describe('SeedService', () => {
  const repository = { count: jest.fn(), insert: jest.fn() };
  let service: SeedService;
  let errorSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getRepositoryToken(Category), useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(SeedService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('nạp bốn danh mục khi bảng đang rỗng', async () => {
    repository.count.mockResolvedValue(0);

    await service.onModuleInit();

    expect(repository.insert).toHaveBeenCalledWith(DEFAULT_CATEGORIES);
  });

  it('bỏ qua khi bảng đã có dữ liệu', async () => {
    repository.count.mockResolvedValue(4);

    await service.onModuleInit();

    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('ghi log lỗi thay vì ném ra khi nạp thất bại', async () => {
    repository.count.mockRejectedValue(new Error('mất bảng'));

    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(
      'Nạp danh mục mặc định thất bại: mất bảng',
    );
  });
});
