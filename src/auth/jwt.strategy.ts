import { JwtModule } from '@nestjs/jwt';

JwtModule.register({
  secret: 'secretKey',

  signOptions: {
    expiresIn: '1d',
  },
});
