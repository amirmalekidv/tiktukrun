import { Module } from '@nestjs/common';
import { CitiesService }              from './cities.service';
import { CitiesController, CitiesAdminController } from './cities.controller';

@Module({
  controllers: [CitiesController, CitiesAdminController],
  providers:   [CitiesService],
  exports:     [CitiesService],
})
export class CitiesModule {}
