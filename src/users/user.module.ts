import { forwardRef, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GardenModule } from '../garden/garden.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { StaticModule } from '../static/static.module';
import { UserSchema } from './schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(() => GardenModule),
    forwardRef(() => StaticModule),
    RealtimeModule
  ],
  providers: [UserService, Logger],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
