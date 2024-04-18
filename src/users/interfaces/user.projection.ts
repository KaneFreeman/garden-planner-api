export interface UserProjection {
  readonly _id: string;
  readonly email: string;
  readonly password?: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly summaryEmail: boolean;
}
