import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@ApiBearerAuth()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Kiểm tra trạng thái kết nối cơ sở dữ liệu' })
  @ApiResponse({
    status: 200,
    description: 'Hệ thống và cơ sở dữ liệu đang hoạt động bình thường',
  })
  @ApiResponse({
    status: 401,
    description: 'Thiếu hoặc sai token xác thực',
  })
  @ApiResponse({
    status: 503,
    description: 'Cơ sở dữ liệu không khả dụng',
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
