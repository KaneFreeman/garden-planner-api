import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RealtimeModule } from '../realtime/realtime.module';
import { PictureController } from './picture.controller';
import { PictureService } from './picture.service';
import { PictureSchema } from './schemas/picture.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Picture', schema: PictureSchema }]), RealtimeModule],
  providers: [PictureService, Logger],
  controllers: [PictureController]
})
export class PictureModule {}
