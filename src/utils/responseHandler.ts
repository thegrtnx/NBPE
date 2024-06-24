import { HttpStatus } from '@nestjs/common';

export class handleResponse {
  public statusType?: string;

  constructor(
    public statusCode: number,
    public message?: string | null,
    public data?: any,
  ) {
    this.statusCode = statusCode;
    this.statusType = HttpStatus[this.statusCode];
  }
}
