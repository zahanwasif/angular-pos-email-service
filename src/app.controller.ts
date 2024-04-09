import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { getSummaryInput } from './interfaces/sendEmailDto';
import { Timestamp } from '@google-cloud/firestore';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  // @Body() getSummaryInput: getSummaryInput
  @Post('get-summary')
  async getSummary(@Body() body: getSummaryInput): Promise<any> {
    const startDate = Timestamp.fromDate(new Date(body.startDate));
    const endDate = Timestamp.fromDate(new Date(body.endDate));
    return this.appService.getSummary(startDate, endDate, body.email);
  }
}
