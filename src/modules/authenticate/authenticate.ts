import { validateRequest } from '../validate-request';
import { validateMandatorySignedHeaders } from '../validate-mandatory-signed-headers';
import { getUrlWithParsedQuery, convertToAwsShortDate, getSignature } from '../../lib';
import { isEqualFixedTime, getHeaderValue, isPresignedUrl, authenticatePresignedUrl } from './lib';

export const authenticate = (config: any, request: any, keyDB: any, mandatorySignedHeaders: any) => {
  const currentDate = new Date();
  validateRequest(request);
  validateMandatorySignedHeaders(mandatorySignedHeaders);
  const uri = getUrlWithParsedQuery(request.url);
  const presignedUrl = isPresignedUrl(config, uri, request);

  if (presignedUrl) {
    return authenticatePresignedUrl(config, request, keyDB, mandatorySignedHeaders, currentDate);
  }

  let requestDate: any;
  let parsedAuthParts: any;
  let requestBody: any;
  let expires: any;

  requestDate =
    config.dateHeaderName.toLowerCase() === 'date'
      ? new Date(getHeaderValue(request, config.dateHeaderName))
      : parseLongDate(getHeaderValue(request, config.dateHeaderName));
  parsedAuthParts = parseAuthHeader(config, getHeaderValue(request, config.authHeaderName), requestDate, keyDB);
  requestBody = request.body || '';
  expires = 0;

  if (!request.host) {
    request.host = getHeaderValue(request, 'host');
  }

  if (!mandatorySignedHeaders) {
    mandatorySignedHeaders = [];
  }

  if (!presignedUrl) {
    mandatorySignedHeaders.push(config.dateHeaderName.toLowerCase());
  }
  mandatorySignedHeaders.forEach((mandatoryHeader: any) => {
    if (!parsedAuthParts.signedHeaders.includes(mandatoryHeader.toLowerCase())) {
      throw new Error('The ' + mandatoryHeader + ' header is not signed');
    }
  });

  if (!isEqualFixedTime(parsedAuthParts.config.credentialScope, config.credentialScope)) {
    throw new Error('Invalid Credential Scope');
  }

  if (!['SHA256', 'SHA512'].includes(parsedAuthParts.config.hashAlgo)) {
    throw new Error('Invalid hash algorithm, only SHA256 and SHA512 are allowed');
  }

  if (!isEqualFixedTime(parsedAuthParts.shortDate, convertToAwsShortDate(requestDate))) {
    throw new Error('Invalid date in authorization header, it should equal with date header');
  }

  const requestTime = requestDate.getTime();
  const currentTime = currentDate.getTime();
  if (!isDateWithinRange(config, requestTime, currentTime, expires)) {
    throw new Error('The request date is not within the accepted time range');
  }

  const generatedAuthParts = getSignature(
    parsedAuthParts.config,
    requestDate,
    request,
    requestBody,
    parsedAuthParts.signedHeaders,
  );
  if (!isEqualFixedTime(parsedAuthParts.signature, generatedAuthParts)) {
    throw new Error('The signatures do not match');
  }

  return parsedAuthParts.config.accessKeyId;
};

function isDateWithinRange(config: any, requestTime: any, currentTime: any, expires: any): any {
  return (
    requestTime - config.clockSkew * 1000 <= currentTime &&
    currentTime < requestTime + expires * 1000 + config.clockSkew * 1000
  );
}

function parseLongDate(longDate: any): any {
  const longDateRegExp = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;
  const m = longDate.match(longDateRegExp);
  if (!m) {
    throw new Error('Invalid date header, expected format is: 20151104T092022Z');
  }

  return new Date(m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + m[6] + ' GMT');
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
