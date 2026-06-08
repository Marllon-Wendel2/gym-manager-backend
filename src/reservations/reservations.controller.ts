import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reservations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Request() req, @Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.createReservation(
      req.user.id,
      createReservationDto,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.reservationsService.findAllReservations(
      req.user.id,
      req.user.role,
    );
  }

  @Get('my-reservations')
  findMyReservations(@Request() req) {
    return this.reservationsService.findMyReservations(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.getReservationById(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Request() req) {
    return this.reservationsService.cancelReservation(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.reservationsService.cancelReservation(id, '', 'ADMIN');
  }
}
