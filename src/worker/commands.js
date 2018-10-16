var WorkerCmds = {
  GEN_KEY: 'generate_key',
  HASH_PASS: 'hash_password',
  LOAD_KEY_FROM_SERVER: 'set_key_from_server',
  LOAD_KEY_FROM_STORE: 'set_key_from_store',
  GEN_VAULT_KEY: 'generate_vault_key',
  CIPHER_KEYS_FOR_USER: 'cipher_keys_for_user',
  PASS_CHANGE: 'pass_change',
  EXPORT: 'export',
  SERIALIZE_AND_CLOSE: 'serialize_and_close',
  OPEN_AND_DESERIALIZE: 'open_and_deserialize',
  OPEN_AND_DESERIALIZE_BULK: 'open_and_deserialize_bulk',
  CLOSE_KEYS_WITH_PASSWORD: 'close_keys_with_password'
}

export default WorkerCmds
