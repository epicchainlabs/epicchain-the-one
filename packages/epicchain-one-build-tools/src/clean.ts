// tslint:disable no-console
import fs from 'fs-extra';
import path from 'path';
import yargs from 'yargs';

const argv = yargs
  .boolean('full')
  .describe('full', 'flag for also cleaning dist/* and .rush/* directories')
  .default('full', false)
  .boolean('debug')
  .describe('debug', 'flag for logging actions')
  .default('debug', false).argv;

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const PACKAGES_DIR = path.resolve(APP_ROOT_DIR, 'packages');

const getLogger = (debug = false) =>
  debug
    ? (input: string | readonly string[]) => console.log(input)
    : (_input: string | readonly string[]) => {
        /* do nothing */
      };

const logger = getLogger(argv.debug);

const packagesToScan: readonly string[] = fs
  .readdirSync(PACKAGES_DIR)
  .filter((dir) => dir !== '.DS_Store')
  .map((dir) => path.join(PACKAGES_DIR, dir));

logger('Packages being scanned:');
logger(packagesToScan);

const deleteAll = (modules: readonly string[]): void => {
  modules.forEach((dir) => {
    if (argv.full) {
      logger(`Removing /.rush: ${path.resolve(dir, '.rush')}`);
      fs.removeSync(path.resolve(dir, '.rush'));
      logger(`Removing /dist: ${path.resolve(dir, 'dist')}`);
      fs.removeSync(path.resolve(dir, 'dist'));
    }
    const filesInPackage = fs.readdirSync(dir);
    filesInPackage.forEach((file) => {
      if (file.includes('.log')) {
        logger(`Removing log file: ${path.resolve(dir, file)}`);
        fs.removeSync(path.resolve(dir, file));
      }
      if (file === 'LICENSE') {
        logger(`Removing LICENSE file: ${path.resolve(dir, file)}`);
        fs.removeSync(path.resolve(dir, file));
      }

      if (file === 'README.md') {
        logger(`Removing README.md from ${path.resolve(dir, file)}`);
        fs.removeSync(path.resolve(dir, file));
      }
    });
  });
  console.log('Done cleaning.');
};

export const clean = () => deleteAll(packagesToScan);
