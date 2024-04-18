export interface TokenProjection {
  readonly _id: string;
  readonly userId: string;
  readonly email: string;
  readonly token: string;
  readonly expires: Date;
}
