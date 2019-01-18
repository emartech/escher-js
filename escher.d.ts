import KeyPool = require('escher-keypool');
import { IncomingMessage } from 'http'

declare namespace Escher {
  enum HashAlgorithm {
    SHA256 = 'SHA256',
    SHA512 = 'SHA512'
  }

  interface Options {
    algoPrefix?: string
    vendorKey?: string
    hashAlgo?: HashAlgorithm
    credentialScope?: string
    authHeaderName?: string
    dateHeaderName?: string
    clockSkew?: number
  }

}

declare class Escher {
  static create (config: Escher.Options): Escher
  preSignUrl (url: string, expires: string): string
  signRequest (request: IncomingMessage, body: string | Buffer, headers?: string[]): IncomingMessage
  authenticate (request: IncomingMessage, keyPool: () => KeyPool, mandatoryHeaders?: string[]): string
  validateRequest (request: IncomingMessage, body: (string | Buffer)): void
  validateMandatorySignedHeaders (mandatoryHeaders: string[]): void
}

export = Escher
