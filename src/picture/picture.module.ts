import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PictureController } from './picture.controller';
import { PictureService } from './picture.service';
import { PictureSchema } from './schemas/picture.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Picture', schema: PictureSchema }])],
  providers: [PictureService, Logger],
  controllers: [PictureController]
})
export class PictureModule {}
