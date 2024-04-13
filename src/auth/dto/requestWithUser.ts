import { Request } from 'express';
import { SessionDTO } from './session.dto';

export type RequestWithUser = Request & { user: SessionDTO };
