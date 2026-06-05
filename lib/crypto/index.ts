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
  createVault,
  unlockWithMaster,
  unlockWithRecovery,
  changeMaster,
  authSecretFor,
} from "./envelope";
export {
  generateRecoveryWords,
  normalizeRecoveryPhrase,
  isValidRecoveryPhrase,
} from "./recovery-key";
export { DEFAULT_KDF, deriveAuthSecret } from "./kdf";
export { bytesEqual } from "./encoding";
