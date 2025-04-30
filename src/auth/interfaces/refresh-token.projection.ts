export interface RefreshTokenProjection {
  readonly _id: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly refreshToken: string;
}
