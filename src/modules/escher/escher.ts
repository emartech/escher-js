import { EscherConfig, EscherRequest, EscherRequestBody } from '../../interface';
import { getEscherConfig, checkPartialEscherConfig } from './lib';
import { validateMandatorySignedHeaders } from '../validate-mandatory-signed-headers';
import { validateRequest } from '../validate-request';
import { signRequest } from '../sign-request';
import { presignUrl } from '../presign-url';
import { authenticate } from '../authenticate';
const DeprecatedEscher = require('../../deprecated/deprecated-escher');

export class Escher {
  private _config: EscherConfig;

  private _useDeprecated: boolean = false;

  constructor(partialConfig?: Partial<EscherConfig>) {
    checkPartialEscherConfig(partialConfig);
    this._config = getEscherConfig(partialConfig);
  }

  public useDeprecated(useDeprecated: boolean): void {
    this._useDeprecated = useDeprecated;
  }

  preSignUrl(url: string, expiration: number): string {
    if (this._useDeprecated) {
      return DeprecatedEscher.create(this._config).preSignUrl(url, expiration);
    }
    return presignUrl(this._config, url, expiration, new Date());
  }

  signRequest(requestOptions: EscherRequest, body: EscherRequestBody, headersToSign: string[]): any {
    if (this._useDeprecated) {
      return DeprecatedEscher.create(this._config).signRequest(requestOptions, body, headersToSign);
    }
    return signRequest(this._config, requestOptions, body, headersToSign);
  }

  authenticate(request: EscherRequest, keyDB: Function, mandatorySignedHeaders: string[]): any {
    if (this._useDeprecated) {
      return DeprecatedEscher.create(this._config).authenticate(request, keyDB, mandatorySignedHeaders);
    }
    return authenticate(this._config, request, keyDB, mandatorySignedHeaders);
  }

  validateRequest(request: EscherRequest, body?: EscherRequestBody): void {
    if (this._useDeprecated) {
      DeprecatedEscher.create(this._config).validateRequest(request, body);
    }
    validateRequest(request, body);
  }

  validateMandatorySignedHeaders(headers?: string[]): void {
    if (this._useDeprecated) {
      DeprecatedEscher.create(this._config).validateMandatorySignedHeaders(headers);
    }
    validateMandatorySignedHeaders(headers);
  }

  public static create(configToMerge?: Partial<EscherConfig>): any {
    return new Escher(configToMerge);
  }
}
