// Public crypto API. Other layers import ONLY from here.

export type {
  KdfParams,
  KdfTuning,
  EncryptedBlob,
  WrappedKey,
  VaultConfigCrypto,
  CreatedVault,
  ChangeMasterResult,
} from "./types";

export { encryptJSON, decryptJSON, encryptBytes, decryptBytes } from "./aes";
export {
  ENVELOPE_VERSION,
  createVault,
  unlockWithMaster,
  unlockWithRecovery,
  changeMaster,
} from "./envelope";
export {
  generateRecoveryWords,
  normalizeRecoveryPhrase,
  isValidRecoveryPhrase,
} from "./recovery-key";
export { DEFAULT_KDF, AUTH_KDF, deriveAuthSecret, authSalt } from "./kdf";
export {
  bytesEqual,
  bytesToBase64,
  base64ToBytes,
  randomBytes,
} from "./encoding";
