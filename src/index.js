import fs from 'fs';
import path from 'path';

const configs = {};
const secrets = {};

export const getConfig = key =>
  key ? (configs.hasOwnProperty(key) ? configs[key] : null) : configs;

export const getSecret = key =>
  key ? (secrets.hasOwnProperty(key) ? secrets[key] : null) : secrets;

const parseConfigValue = value => {
  if (typeof value === 'string' && ['yes', 'true'].includes(value.toLowerCase())) {
    return true;
  }

  if (typeof value === 'string' && ['no', 'false'].includes(value.toLowerCase())) {
    return false;
  }

  return value;
};

export const initConfig = (keys = [], { log } = {}) => {
  keys.forEach(k => {
    let key;
    let defaultValue = null;

    if (typeof k === 'string') {
      key = k;
    } else if (typeof k === 'object') {
      ({ name: key, defaultValue = null } = k);
    } else {
      throw new Error(`Invalid key type found: ${k}`);
    }

    if (!key) {
      throw new Error('Config variable name not provided');
    }

    const envKey = key.toUpperCase();

    if (process.env.hasOwnProperty(envKey)) {
      configs[key] = parseConfigValue(process.env[envKey]);
      log &&
        log.info(
          { env: { name: key, config: k, value: configs[key] } },
          `Loaded configuration variable`
        );
    } else {
      configs[key] = defaultValue;
      log &&
        log.info(
          { env: { name: key, config: k, value: configs[key] } },
          `Expected environment variable not set; using default`
        );
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
