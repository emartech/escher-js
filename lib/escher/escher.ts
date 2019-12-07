import { EscherConfig } from '../../interface';
const DeprecatedEscher = require('./deprecated-escher');

export class Escher {
  private _deprecatedEscher: any;

  constructor(partialConfig?: Partial<EscherConfig>) {
    this._deprecatedEscher = new DeprecatedEscher(partialConfig);
  }

  preSignUrl(url: string, expires: number): string {
    return this._deprecatedEscher.preSignUrl(url, expires);
  }

  signRequest(requestOptions: any, body: any, headersToSign: any): any {
    return this._deprecatedEscher.signRequest(requestOptions, body, headersToSign);
  }

  authenticate(request: any, keyDB: any, mandatorySignedHeaders: any): any {
    return this._deprecatedEscher.authenticate(request, keyDB, mandatorySignedHeaders);
  }

  validateRequest(request: any, body: any): void {
    this._deprecatedEscher.validateRequest(request, body);
  }

  validateMandatorySignedHeaders(mandatorySignedHeaders: any): void {
    this._deprecatedEscher.validateMandatorySignedHeaders(mandatorySignedHeaders);
  }

  public static create(configToMerge?: Partial<EscherConfig>): any {
    return new Escher(configToMerge);
  }
}
