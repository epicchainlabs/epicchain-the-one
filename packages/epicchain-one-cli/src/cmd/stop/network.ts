import yargs from 'yargs';
import { start } from '../../common';
import { findKillProcess } from '../../utils';

export const command = 'network';
export const describe = 'Stops the local development network.';
export const builder = (yargsBuilder: typeof yargs) => yargsBuilder;
export const handler = () => {
  start(async (_cmd, config) => {
    await findKillProcess('network', config);
  });
};
