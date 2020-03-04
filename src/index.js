import fs from 'fs';
import path from 'path';

const configs = {};
const secrets = {};

export const initConfig = (keys = [], { log } = {}) => {
  keys.forEach(k => {
    const key = k.toUpperCase();

    configs[k] = process.env[key] || null;

    if (process.env.hasOwnProperty(key)) {
      configs[k] = process.env[key];
      log &&
        log.info(
          { env: { name: key, config: k, value: configs[k] } },
          `Loaded configuration variable`
        );
    } else {
      log && log.info({ env: { name: key, config: k } }, `Expected environment variable not set`);
    }
  });
};

export const initSecrets = (keys = [], { log, dir, trim = true } = {}) => {
  const secretsDir = dir || process.env.SECRETS_DIR || path.join(process.env.PWD, 'secrets');

  log && log.info({ secretsDir }, 'Secret loading starting');

  keys.forEach(k => {
    const filename = process.env[`${k.toUpperCase()}_FILE`] || path.join(secretsDir, k);

    try {
      let value = fs.readFileSync(filename, 'utf-8');

      if (trim) {
        value = value.trim();
      }

      secrets[k] = value;

      log && log.info({ secret: { name: k, path: filename } }, `Secret loaded`);
    } catch (err) {
      log && log.error({ err, secret: { name: k, path: filename } }, `Error loading secret`);
    }
  });
};

export const getConfig = key => configs[key] || null;

export const getSecret = key => secrets[key] || null;
