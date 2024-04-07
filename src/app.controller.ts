import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { getSummaryInput } from './interfaces/sendEmailDto';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  // @Body() getSummaryInput: getSummaryInput
  @Post('get-summary')
  async getSummary(): Promise<any> {
    return this.appService.getSummary();
  }
}
