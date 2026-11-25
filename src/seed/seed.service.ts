import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { DEFAULT_CATEGORIES } from './default-categories';

@Injectable()
export class SeedService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const count = await this.categories.count();
      if (count > 0) {
        this.logger.log(
          `Bảng categories đã có ${count} danh mục, bỏ qua nạp dữ liệu`,
        );
        return;
      }

      await this.categories.insert(DEFAULT_CATEGORIES);
      this.logger.log(`Đã nạp ${DEFAULT_CATEGORIES.length} danh mục mặc định`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Nạp danh mục mặc định thất bại: ${message}`);
    }
  }

  onModuleDestroy(): void {
    this.logger.log('Ứng dụng đang tắt, dừng SeedService');
  }
}
