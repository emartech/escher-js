import { Escher } from './modules/escher';

export default Escher;

export * from './modules/authenticate';
export * from './modules/presign-url';
export * from './modules/sign-request';
export * from './modules/validate-mandatory-signed-headers';
export * from './modules/validate-request';

export {
  Authenticate,
  AuthenticateConfig,
  EscherRequest,
  PresignUrl,
  PresignUrlConfig,
  SignRequest,
  SignRequestConfg,
  EscherRequestBody,
} from './interface';

export {
  createAuthenticateConfig,
  createEscherRequest,
  createPresignUrlConfig,
  createSignRequestConfg,
} from './factory';
