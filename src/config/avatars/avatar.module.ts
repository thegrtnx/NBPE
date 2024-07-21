import { Global, Module } from '@nestjs/common';
import { AvatarService } from './avatar.service';

@Global()
@Module({
  providers: [AvatarService],
  exports: [AvatarService],
})
export class AvatarModule {}
