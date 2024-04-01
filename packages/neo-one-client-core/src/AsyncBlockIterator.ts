import { Block, GetOptions, IterOptions } from '@neo-one/client-common';
import _ from 'lodash';

type Item = { readonly type: 'value'; readonly value: Block } | { readonly type: 'error'; readonly error: Error };
interface Resolver {
  readonly resolve: (value: IteratorResult<Block>) => void;
  readonly reject: (reason: Error) => void;
}

interface Client {
  readonly getBlockCount: () => Promise<number>;
  readonly getBlock: (index: number, options?: GetOptions) => Promise<Block>;
}

interface AsyncBlockIteratorOptions {
  readonly client: Client;
  readonly options: IterOptions;
  readonly fetchTimeoutMS?: number;
  readonly batchSize?: number;
}

const FETCH_TIMEOUT_MS = 20000;
const QUEUE_SIZE = 1000;
const BATCH_SIZE = 10;

export class AsyncBlockIterator implements AsyncIterator<Block> {
  private readonly client: Client;
  private readonly mutableItems: Item[];
  private mutableResolvers: Resolver[];
  private mutableDone: boolean;
  private mutableCurrentIndex: number | undefined;
  private mutableFetching: boolean;
  private mutableStartHeight: number | undefined;
  private readonly indexStop: number | undefined;
  private readonly fetchTimeoutMS: number;
  private readonly batchSize: number;

  public constructor({
    client,
    options: { indexStart, indexStop },
    fetchTimeoutMS = FETCH_TIMEOUT_MS,
    batchSize = BATCH_SIZE,
  }: AsyncBlockIteratorOptions) {
    this.client = client;
    this.mutableItems = [];
    this.mutableResolvers = [];
    this.mutableDone = false;
    this.mutableCurrentIndex = indexStart;
    this.mutableFetching = false;
    this.indexStop = indexStop;
    this.fetchTimeoutMS = fetchTimeoutMS;
    this.batchSize = batchSize;
  }

  public [Symbol.asyncIterator]() {
    return this;
  }

  public async next(): Promise<IteratorResult<Block>> {
    if (!this.mutableDone) {
      this.fetch();
    }

    const item = this.mutableItems.shift();
    if (item !== undefined) {
      if (item.type === 'error') {
        return Promise.reject(item.error);
      }

      return Promise.resolve({ done: false, value: item.value });
    }

    if (this.mutableDone) {
      // tslint:disable-next-line no-any
      return Promise.resolve({ done: true } as any);
    }

    // tslint:disable-next-line promise-must-complete
    return new Promise<IteratorResult<Block>>((resolve, reject) => {
      this.mutableResolvers.push({ resolve, reject });
    });
  }

  private write(value: Block): void {
    this.push({ type: 'value', value });
  }

  private error(error: Error): void {
    this.push({ type: 'error', error });
  }

  private push(item: Item): void {
    if (this.mutableDone) {
      /* istanbul ignore next */
      throw new Error('AsyncBlockIterator already ended');
    }

    const resolver = this.mutableResolvers.shift();
    if (resolver !== undefined) {
      const { resolve, reject } = resolver;
      if (item.type === 'error') {
        reject(item.error);
      } else {
        resolve({ done: false, value: item.value });
      }
    } else {
      this.mutableItems.push(item);
    }
  }

  private done(): void {
    // tslint:disable-next-line no-any
    this.mutableResolvers.forEach(({ resolve }) => resolve({ done: true } as any));
    // tslint:disable-next-line no-any
    this.mutableResolvers = [];
    this.mutableDone = true;
  }

  private fetch(): void {
    if (this.mutableFetching) {
      return;
    }
    this.mutableFetching = true;
    this.asyncFetch()
      .then(() => {
        this.mutableFetching = false;
      })
      .catch((error) => {
        this.mutableFetching = false;
        this.error(error);
      });
  }

  private async asyncFetch(): Promise<void> {
    let startHeight = this.mutableStartHeight;
    let indexIn = this.mutableCurrentIndex;
    if (startHeight === undefined || indexIn === undefined) {
      const blockCount = await this.client.getBlockCount();
      if (startHeight === undefined) {
        startHeight = blockCount - 1;
        this.mutableStartHeight = startHeight;
      }
      if (indexIn === undefined) {
        indexIn = blockCount - 1;
        this.mutableCurrentIndex = indexIn;
      }
    }
    const index = indexIn;

    const incIndex = (value: number) => {
      if (this.mutableCurrentIndex === undefined) {
        throw new Error('Something went wrong!');
      }
      this.mutableCurrentIndex += value;
    };

    if (this.indexStop !== undefined && index >= this.indexStop) {
      this.done();
    } else if (index >= startHeight) {
      const [block, newStartHeight] = await Promise.all([
        this.fetchOne(index),
        // Refresh the block count in case we got behind somehow
        this.client.getBlockCount(),
      ]);

      incIndex(1);
      this.write(block);
      this.mutableStartHeight = newStartHeight;
    } else {
      let toFetch = Math.min(QUEUE_SIZE - this.mutableItems.length, startHeight - index);

      if (this.indexStop !== undefined) {
        toFetch = Math.min(toFetch, this.indexStop - index);
      }

      // tslint:disable-next-line no-loop-statement
      for (const chunk of _.chunk(_.range(0, toFetch), this.batchSize)) {
        const blocks = await Promise.all(chunk.map(async (offset) => this.fetchOne(index + offset, true)));

        incIndex(chunk.length);
        blocks.forEach((block) => this.write(block));
      }
    }
  }

  private async fetchOne(index: number, isBatch = false): Promise<Block> {
    try {
      // tslint:disable-next-line no-unnecessary-local-variable prefer-immediate-return
      const block = await this.client.getBlock(
        index,
        isBatch
          ? {}
          : {
              timeoutMS: this.fetchTimeoutMS,
            },
      );

      // tslint:disable-next-line no-var-before-return
      return block;
    } catch (error) {
      if (error.code === 'UNKNOWN_BLOCK') {
        return this.fetchOne(index, isBatch);
      }

      throw error as Error;
    }
  }
}
