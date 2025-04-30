import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DEVICE_ID_COOKIE } from '../constants';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DeviceIdMiddleware implements NestMiddleware {
  use(req: Request & { deviceId?: string }, res: Response, next: NextFunction) {
    let deviceId: string;

    if (req.cookies && req.cookies[DEVICE_ID_COOKIE]) {
      deviceId = req.cookies[DEVICE_ID_COOKIE];
    } else {
      deviceId = uuidv4();
      res.cookie(DEVICE_ID_COOKIE, deviceId, {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000
      });
    }

    // 4. Attach the device ID to the request object for easy access in controllers
    req['deviceId'] = deviceId;

    // 5. Call the next middleware or route handler
    next();
  }
}
