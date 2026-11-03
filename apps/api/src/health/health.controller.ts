import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HealthService, type HealthReport } from "./health.service";

@Controller("health")
export class HealthController {
  // Explicit @Inject: tsx (esbuild) does not emit decorator metadata.
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async get(): Promise<HealthReport> {
    const report = await this.health.check();
    if (report.status !== "ok") {
      throw new ServiceUnavailableException(report);
    }
    return report;
  }
}
