import { AuthenticateConfig, ValidRequest } from '../../../../interface';
import { getSignature, getNormalizedHeaderName, convertToAwsLongDate } from '../../../../lib';
import { getHeaderValue } from '../get-header-value';
import { isEqualFixedTime } from '../is-equal-fixed-time';
import { checkMandatorySignHeaders } from '../check-mandatory-sign-headers';
import { checkRequestDate } from '../check-request-date';
import { split, last, init, defaultTo } from 'ramda';
import { parseLongDate } from '../parse-long-date';

export type AuthenticateHeaders = (
  config: AuthenticateConfig,
  request: ValidRequest,
  keyDB: Function,
  mandatorySignedHeaders: string[],
  currentDate: Date,
) => string;

export const authenticateHeaders: AuthenticateHeaders = (
  config,
  request: any,
  keyDB,
  mandatorySignedHeaders,
  currentDate,
) => {
  const requestDate = getRequestDate(config, request);
  const parsedAuthParts: any = parseAuthHeader(
    config,
    getHeaderValue(request, config.authHeaderName),
    requestDate,
    keyDB,
  );
  const expires = 0;

  checkMandatorySignHeaders(parsedAuthParts.signedHeaders, [
    ...mandatorySignedHeaders,
    'host',
    getNormalizedHeaderName(config.dateHeaderName),
  ]);
  checkRequestDate(
    config,
    getCredentials(getHeaderValue(request, config.authHeaderName) as any),
    convertToAwsLongDate(requestDate),
    expires,
    currentDate,
  );

  if (!isEqualFixedTime(parsedAuthParts.config.credentialScope, config.credentialScope)) {
    throw new Error('Invalid Credential Scope');
  }

  if (!['SHA256', 'SHA512'].includes(parsedAuthParts.config.hashAlgo)) {
    throw new Error('Invalid hash algorithm, only SHA256 and SHA512 are allowed');
  }

  const generatedAuthParts = getSignature(
    parsedAuthParts.config,
    requestDate,
    request,
    defaultTo('', request.body),
    parsedAuthParts.signedHeaders,
  );
  if (!isEqualFixedTime(parsedAuthParts.signature, generatedAuthParts)) {
    throw new Error('The signatures do not match');
  }

  return parsedAuthParts.config.accessKeyId;
};

function getRequestDate(config: AuthenticateConfig, request: ValidRequest): Date {
  const dateHeaderName = getNormalizedHeaderName(config.dateHeaderName);
  const dateHeaderValue = getHeaderValue(request, dateHeaderName) as string;
  return dateHeaderName === 'date' ? new Date(dateHeaderValue) : parseLongDate(dateHeaderValue);
}

function getCredentials(header: string): string {
  const [, credentialsPair] = split(' ', header);
  return init(last(split('=', credentialsPair))!);
}

function parseAuthHeader(config: any, authHeader: any, requestDate: any, keyDB: any): any {
  const algoRegExp = config.algoPrefix + '-HMAC-([A-Za-z0-9\\,]+)';
  const credentialRegExpDefinition = '([A-Za-z0-9\\-_]+)/([0-9]{8})/([A-Za-z0-9\\-_ /]+)';
  const signedHeadersRegExpDefinition = '([A-Za-z\\-;]+)';
  const signatureRegExpDefinition = '([0-9a-f]+)';
  // eslint-disable-next-line security/detect-non-literal-regexp
  const regex = new RegExp(
    '^' +
      algoRegExp +
      ' Credential=' +
      credentialRegExpDefinition +
      ', SignedHeaders=' +
      signedHeadersRegExpDefinition +
      ', Signature=' +
      signatureRegExpDefinition +
      '$',
  );
  const matches = authHeader.match(regex);

  if (!matches) {
    throw new Error('Invalid auth header format');
  }

  const parsedConfig = {
    vendorKey: config.vendorKey,
    algoPrefix: config.algoPrefix,
    date: requestDate,
    hashAlgo: matches[1],
    accessKeyId: matches[2],
    apiSecret: keyDB(matches[2]),
    credentialScope: matches[4],
  };

  if (typeof parsedConfig.apiSecret !== 'string') {
    throw new Error('Invalid Escher key');
  }

  return {
    shortDate: matches[3],
    config: parsedConfig,
    signedHeaders: matches[5].split(';'),
    signature: matches[6],
  };
}
