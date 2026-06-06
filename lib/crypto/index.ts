// Public crypto API. Other layers import ONLY from here.

export type {
  KdfParams,
  KdfTuning,
  EncryptedBlob,
  WrappedKey,
  VaultConfigCrypto,
  CreatedVault,
  ChangeMasterResult,
  RotateRecoveryResult,
} from "./types";

export { encryptJSON, decryptJSON, encryptBytes, decryptBytes } from "./aes";
export {
  ENVELOPE_VERSION,
  createVault,
  unlockWithMaster,
  unlockWithRecovery,
  changeMaster,
  rotateRecovery,
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
