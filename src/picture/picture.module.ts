import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PictureService } from './picture.service';
import { PictureController } from './picture.controller';
import { PictureSchema } from './schemas/picture.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Picture', schema: PictureSchema }])],
  providers: [PictureService],
  controllers: [PictureController]
})
export class PictureModule {}
