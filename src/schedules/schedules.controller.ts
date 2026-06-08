import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import {
  BlockDayDto,
  BlockHourDto,
  UnblockHourDto,
} from './dto/block-schedule.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('schedules')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('block-day')
  @Roles('ADMIN')
  blockFullDay(@Body() blockDayDto: BlockDayDto) {
    return this.schedulesService.blockFullDay(blockDayDto);
  }

  @Get('calendar')
  async getCalendar() {
    return this.schedulesService.getCalendarForNext30Days();
  }

  @Delete('unblock-day/:date')
  @Roles('ADMIN')
  unblockFullDay(@Param('date') date: string) {
    return this.schedulesService.unblockFullDay(date);
  }

  @Post('block-hour')
  @Roles('ADMIN')
  blockSpecificHour(@Body() blockHourDto: BlockHourDto) {
    return this.schedulesService.blockSpecificHour(blockHourDto);
  }

  @Delete('unblock-hour')
  @Roles('ADMIN')
  unblockSpecificHour(@Body() unblockHourDto: UnblockHourDto) {
    return this.schedulesService.unblockSpecificHour(unblockHourDto);
  }

  @Get('blocked')
  @Roles('ADMIN')
  findBlockedSchedules() {
    return this.schedulesService.findBlockedSchedules();
  }

  @Get('blocked-days')
  @Roles('ADMIN')
  findFullyBlockedDays() {
    return this.schedulesService.findFullyBlockedDays();
  }
}
