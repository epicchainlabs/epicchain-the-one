import { Transaction } from '@neo-one/node-core';
export interface Transactions {
  readonly [hash: string]: Transaction | undefined;
}
