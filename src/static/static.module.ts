import { Logger, Module, forwardRef } from '@nestjs/common';
import { UserModule } from '../users/user.module';
import { StaticController } from './static.controller';
import { StaticService } from './static.service';

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [StaticService, Logger],
  controllers: [StaticController],
  exports: [StaticService]
})
export class StaticModule {}
