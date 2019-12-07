import { EscherConfig } from './interface';
import { getEscherConfig } from './lib/get-escher-config';
import { checkPartialEscherConfig } from './lib/check-partial-escher-config';
import { validateMandatorySignedHeaders } from './actions';
const DeprecatedEscher = require('./deprecated-escher');

export class Escher {
  private _config: EscherConfig;

  constructor(partialConfig?: any) {
    checkPartialEscherConfig(partialConfig);
    this._config = getEscherConfig(partialConfig);
  }

  preSignUrl(url: string, expires: number): string {
    return new DeprecatedEscher(this._config).preSignUrl(url, expires);
  }

  signRequest(requestOptions: any, body: any, headersToSign: any): any {
    return new DeprecatedEscher(this._config).signRequest(requestOptions, body, headersToSign);
  }

  authenticate(request: any, keyDB: any, mandatorySignedHeaders: any): any {
    return new DeprecatedEscher(this._config).authenticate(request, keyDB, mandatorySignedHeaders);
  }

  validateRequest(request: any, body: any): void {
    new DeprecatedEscher(this._config).validateRequest(request, body);
  }

  validateMandatorySignedHeaders(headers: any): void {
    validateMandatorySignedHeaders(headers);
  }

  public static create(configToMerge?: Partial<EscherConfig>): any {
    return new Escher(configToMerge);
  }
}
