export enum UserRole {
  Admin = 'Admin',
  EventCreator = 'EventCreator',
  Operator = 'Operator',
  User = 'User',
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
