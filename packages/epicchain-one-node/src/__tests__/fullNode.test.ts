import { createTest } from '@epicchain-the-one/node-neo-settings';
import { FullNode } from '../FullNode';

jest.setTimeout(30000000);

describe('full node test', () => {
  test('', async () => {
    const path = '/Users/danielbyrne/Desktop/test-location';
    const blockchainSettings = createTest();
    const nodeOptions = {
      externalPort: 8080,
      rpcURLs: [
        'http://testnet1-seed.epic-chain.org::20332',
        'http://testnet3-seed.epic-chain.org:20332',
        'http://testnet4-seed.epic-chain.org::20332',
        'http://testnet4-seed.epic-chain.org::20332',
      ],
    };

    const networkOptions = {
      seeds: [
        'http://testnet1-seed.epic-chain.org:20333',
        'http://testnet2-seed.epic-chain.org:20333',
        'http://testnet3-seed.epic-chain.org:20333',
        'http://testnet4-seed.epic-chain.org::20333',
        'http://testnet4-seed.epic-chain.org::20333',
      ],
    };

    const rpcOptions = {
      http: {
        port: 8080,
        host: 'localhost',
      },
    };

    const telemetryOptions = {
      logging: {
        level: 'debug' as const,
      },
    };

    const options = {
      options: {
        path,
        blockchain: blockchainSettings,
        node: nodeOptions,
        network: networkOptions,
        rpc: rpcOptions,
        telemetry: telemetryOptions,
      },
    };

    const fullNode = new FullNode(options);

    await fullNode.start();
  });
});
