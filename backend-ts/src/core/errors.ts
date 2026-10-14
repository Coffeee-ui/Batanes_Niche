export class HttpError extends Error {
  public status: number;
  public detail: string | Array<{ loc?: string[]; msg: string; type?: string }>;

  constructor(status: number, detail: string | Array<{ loc?: string[]; msg: string; type?: string }>) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail));
    this.status = status;
    this.detail = detail;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}
