import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppWebSocketGateway } from './websocket.gateway';
import { getRequiredEnv } from '../config/env.validation';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: getRequiredEnv('JWT_SECRET'),
    }),
  ],
  providers: [AppWebSocketGateway],
  exports: [AppWebSocketGateway],
})
export class WebSocketModule {}
