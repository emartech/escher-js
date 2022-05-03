import { AuthenticateConfig, EscherRequest } from '../../../../interface';
import { getSignature, getNormalizedHeaderName, convertToAwsLongDate } from '../../../../lib';
import { getHeaderValue } from '../get-header-value';
import { isEqualFixedTime } from '../is-equal-fixed-time';
import { checkMandatorySignHeaders } from '../check-mandatory-sign-headers';
import { checkRequestDate } from '../check-request-date';
import { split, last, init, defaultTo, trim, head } from 'ramda';
import { parseLongDate } from '../parse-long-date';
import { getSignatureConfigFromHeader } from '../get-signature-config-from-header';
import { checkSignatureConfig } from '../check-signature-config';

export type AuthenticateHeaders = (
  config: AuthenticateConfig,
  request: EscherRequest,
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
  const authHeader = getHeaderValue(request, config.authHeaderName) as string;
  const signature = getSignatureFromHeader(authHeader);
  const signedHeaders = getSignedHeadersFromHeader(authHeader);
  const requestDate = getRequestDate(config, request);
  const expires = 0;
  const signatureConfig = getSignatureConfigFromHeader(config, authHeader, keyDB);
  checkMandatorySignHeaders(signedHeaders, [
    ...mandatorySignedHeaders,
    'host',
    getNormalizedHeaderName(config.dateHeaderName),
  ]);
  checkRequestDate(
    config,
    getCredentialsFromHeader(authHeader),
    convertToAwsLongDate(requestDate),
    expires,
    currentDate,
  );
  checkSignatureConfig(config, signatureConfig);
  const generatedSignature = getSignature(
    signatureConfig,
    requestDate,
    request,
    defaultTo('', request.body),
    signedHeaders,
  );
  if (!isEqualFixedTime(signature, generatedSignature)) {
    throw new Error('The signatures do not match');
  }
  return getAccesskeyId(authHeader);
};

function getRequestDate(config: AuthenticateConfig, request: EscherRequest): Date {
  const dateHeaderName = getNormalizedHeaderName(config.dateHeaderName);
  const dateHeaderValue = getHeaderValue(request, dateHeaderName) as string;
  return dateHeaderName === 'date' ? new Date(dateHeaderValue) : parseLongDate(dateHeaderValue);
}

function getCredentialsFromHeader(header: string): string {
  const [, credentialsPair] = split(' ', header);
  return init(last(split('=', credentialsPair))!);
}

function getSignatureFromHeader(header: string): string {
  const signaturePair = trim(last(split(',', header))!);
  return last(split('=', signaturePair))!;
}

function getSignedHeadersFromHeader(header: string): string[] {
  const [, signedHeadersPair] = split(',', header);
  return split(';', last(split('=', trim(signedHeadersPair)))!);
}

function getAccesskeyId(header: string): string {
  const credentials = getCredentialsFromHeader(header);
  return head(split('/', credentials))!;
}
