import { forwardRef, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GardenModule } from '../garden/garden.module';
import { UserSchema } from './schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]), forwardRef(() => GardenModule)],
  providers: [UserService, Logger],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
