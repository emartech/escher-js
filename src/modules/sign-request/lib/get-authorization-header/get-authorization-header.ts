import { EscherRequestHeader, EscherConfig, EscherRequest, EscherRequestBody } from '../../../../interface';
import {
  getAuthorizationAlgo,
  getCredential,
  getNormalizedHeaderName,
  getSignedHeaders,
  getSignature,
} from '../../../../lib';

export type GetAuthorizationHeader = (
  config: EscherConfig,
  date: Date,
  request: EscherRequest,
  body: EscherRequestBody,
  headersToSign: string[],
) => EscherRequestHeader;

export const getAuthorizationHeader: GetAuthorizationHeader = (config, date, request, body, headersToSign) => {
  const headerName = getNormalizedHeaderName(config.authHeaderName);
  const headerValue = getHeaderValue(config, date, request, body, headersToSign);
  return [headerName, headerValue];
};

function getHeaderValue(
  config: EscherConfig,
  date: Date,
  request: EscherRequest,
  body: EscherRequestBody,
  headersToSign: string[],
): string {
  const authorizationAlgo = getAuthorizationAlgo(config);
  const credential = getCredential(config, date);
  const signedHeaders = getSignedHeaders(headersToSign);
  const signature = getSignature(config, date, request, body, headersToSign);
  return `${authorizationAlgo} Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}
