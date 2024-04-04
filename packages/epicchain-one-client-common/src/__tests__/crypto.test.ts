import _ from 'lodash';
import { keys } from '../__data__';
import { common, ECPoint } from '../common';
import { crypto } from '../crypto';
import { WitnessModel } from '../models';

const initKey = common.hexToECPoint('02f61596eafa6303d6782afee3f221254c028deeac620a28b96112a9d08594fd88');
const secondKey = common.hexToECPoint('030d56c2d8dbe1069b910246f7f39d0f4b743557e90603f94fa1d5e8ab8f5fbcf0');
const triaryKey = common.hexToECPoint('02ebbc1c117a9ab39a9bcfcb9e776feedee8ab870f5cdcdaee1dff07f1972996e4');
const message = Buffer.from('test', 'hex');

// tslint:disable-next-line no-loop-statement
for (const key of keys) {
  const { address, privateKey, publicKey, wif, password, encryptedWIF, scriptHash, name } = key;

  describe(`crypto using ${name} key`, () => {
    test('privateKeyToPublicKey', () => {
      expect(crypto.privateKeyToPublicKey(privateKey)).toEqual(publicKey);
    });

    test('publicKeyToScriptHash', () => {
      expect(crypto.publicKeyToScriptHash(publicKey)).toEqual(scriptHash);
    });

    test('scriptHashToAddress', () => {
      expect(
        crypto.scriptHashToAddress({
          addressVersion: common.NEO_ADDRESS_VERSION,
          scriptHash,
        }),
      ).toEqual(address);
    });

    test('addressToScriptHash', () => {
      expect(
        crypto.addressToScriptHash({
          addressVersion: common.NEO_ADDRESS_VERSION,
          address,
        }),
      ).toEqual(scriptHash);
    });

    test('privateKeyToWIF', () => {
      expect(crypto.privateKeyToWIF(privateKey, common.NEO_PRIVATE_KEY_VERSION)).toEqual(wif);
    });

    test('wifToPrivateKey', () => {
      expect(crypto.wifToPrivateKey(wif, common.NEO_PRIVATE_KEY_VERSION)).toEqual(privateKey);
    });

    test('privateKeyToScriptHash', () => {
      expect(crypto.privateKeyToScriptHash(privateKey)).toEqual(scriptHash);
    });

    test('privateKeyToAddress', () => {
      expect(
        crypto.privateKeyToAddress({
          addressVersion: common.NEO_ADDRESS_VERSION,
          privateKey,
        }),
      ).toEqual(address);
    });

    test('createInvocationScript', () => {
      const script = crypto.createInvocationScript(message, privateKey);
      expect(script).toMatchSnapshot();
    });

    test('encryptNEP2', async () => {
      expect(
        await crypto.encryptNEP2({
          addressVersion: common.NEO_ADDRESS_VERSION,
          password,
          privateKey,
        }),
      ).toEqual(encryptedWIF);
    });

    test('decryptNEP2', async () => {
      expect(
        await crypto.decryptNEP2({
          addressVersion: common.NEO_ADDRESS_VERSION,
          password,
          encryptedKey: encryptedWIF,
        }),
      ).toEqual(privateKey);
    });
  });
}

describe('Crypto Function Coverage', () => {
  test('createPrivateKey', () => {
    const pk = crypto.createPrivateKey();
    expect(
      crypto.wifToPrivateKey(
        crypto.privateKeyToWIF(pk, common.NEO_PRIVATE_KEY_VERSION),
        common.NEO_PRIVATE_KEY_VERSION,
      ),
    ).toEqual(pk);
    expect(
      crypto.privateKeyToAddress({
        addressVersion: common.NEO_ADDRESS_VERSION,
        privateKey: pk,
      }),
    ).toBeTruthy();
  });

  test('createKeypair', () => {
    const kp = crypto.createKeyPair();
    expect(
      crypto.wifToPrivateKey(
        crypto.privateKeyToWIF(kp.privateKey, common.NEO_PRIVATE_KEY_VERSION),
        common.NEO_PRIVATE_KEY_VERSION,
      ),
    ).toEqual(kp.privateKey);
    expect(crypto.privateKeyToPublicKey(kp.privateKey)).toEqual(kp.publicKey);
  });

  test('toECPoint', () => {
    expect(crypto.toECPoint(common.ecPointToBuffer(initKey))).toEqual(initKey);
  });

  test('CreateMultiSignatureVerificationScript - Single Key', () => {
    const script = crypto.createMultiSignatureVerificationScript(1, [initKey]);
    expect(script).toMatchSnapshot();
  });

  test('CreateMultiSignatureVerificationScript - Multiple Keys', () => {
    const script = crypto.createMultiSignatureVerificationScript(3, [initKey, secondKey, triaryKey]);
    expect(script).toMatchSnapshot();
  });

  test('CreateMultiSignatureWitness - Single Key', () => {
    const keysToSigs = {
      [`${common.ecPointToHex(initKey)}`]: Buffer.from('init', 'hex'),
    };

    const witness = crypto.createMultiSignatureWitness(1, [initKey], keysToSigs, WitnessModel);
    expect(witness).toMatchSnapshot();
  });

  test('CreateMultiSignatureWitness - Multiple Keys', () => {
    const keysToSigs = {
      [`${common.ecPointToHex(initKey)}`]: Buffer.from('init', 'hex'),
      [`${common.ecPointToHex(secondKey)}`]: Buffer.from('secondary', 'hex'),
      [`${common.ecPointToHex(triaryKey)}`]: Buffer.from('triary', 'hex'),
    };

    const witness = crypto.createMultiSignatureWitness(3, [initKey, secondKey, triaryKey], keysToSigs, WitnessModel);
    expect(witness).toMatchSnapshot();
  });

  test('GetConsensusAddress', () => {
    const address = crypto.getConsensusAddress([initKey]);
    expect(address).toMatchSnapshot();
  });
});

describe('Crypto Errors', () => {
  test('Verify - Signature Too Long', () => {
    const verifyThrows = () =>
      crypto.verify({
        message,
        signature: Buffer.from(_.range(65).map(() => 0x01)),
        publicKey: initKey,
      });
    expect(verifyThrows).toThrowError(`Invalid Signature length. Found: 65, Max: 64`);
  });

  test('Base58CheckDecode - CheckError', () => {
    const decodeThrows = () =>
      crypto.addressToScriptHash({
        addressVersion: common.NEO_ADDRESS_VERSION,
        address: '57',
      });

    expect(decodeThrows).toThrowError('Base58 Check Decode Error on decoding: 57');
  });

  test('addressToScriptHash - InvalidAddress', () => {
    const badAddress = 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW';
    const scriptHashThrows = () =>
      crypto.addressToScriptHash({
        addressVersion: 5, // this is actually the thing that throws it
        address: badAddress,
      });

    expect(scriptHashThrows).toThrowError(`Invalid Address: ${badAddress}`);
  });

  test('CreateMultiSignatureVerificationScript - BadNumberKeys', () => {
    const badKeysThrows = () => crypto.createMultiSignatureVerificationScript(3, [initKey]);
    expect(badKeysThrows).toThrowError(
      `invalid number of keys. Found: 3 keys, must be between 1 and 1 (number of public keys).`,
    );
  });

  test('CreateMultiSignatureVerificationScript - TooManyKeys', () => {
    // tslint:disable-next-line:no-object-literal-type-assertion
    const badKeys = { length: 1025 } as readonly ECPoint[];
    expect(() => crypto.createMultiSignatureVerificationScript(3, badKeys)).toThrowError(
      'Too many public keys. Found: 1025, Max: 1024',
    );
  });

  test('createMultiSignatureWitness - InvalidSignatures', () => {
    const badSigsThrows = () =>
      crypto.createMultiSignatureWitness(2, [initKey, secondKey], { one: Buffer.from('hmmm') }, WitnessModel);
    expect(badSigsThrows).toThrowError(`Expected ${2} unique signatures, found: ${0}.`);
  });
});

describe('BIP32 HD Node Functions', () => {
  const testVectors = [
    '000102030405060708090a0b0c0d0e0f',
    'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
    '4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be',
  ];

  testVectors.forEach((seed, index) => {
    test(`parseMasterSeed - seed ${index}`, () => {
      const node = crypto.parseMasterSeed(seed);

      expect(node).toMatchSnapshot();
    });

    test(`serializeHDNode - private - seed ${index}`, () => {
      const node = crypto.parseMasterSeed(seed);
      const serialized = crypto.serializeHDNode(node, true);

      expect(serialized).toMatchSnapshot();
    });

    test(`serializeHDNode - public - seed ${index}`, () => {
      const node = crypto.parseMasterSeed(seed);
      const serialized = crypto.serializeHDNode(node, false);

      expect(serialized).toMatchSnapshot();
    });

    test(`serializing an extendedKey should be equivalent - seed ${index}`, () => {
      const node = crypto.parseMasterSeed(seed);
      const privateExtended = crypto.serializeHDNode(node, true);
      const privateNode = crypto.parseExtendedKey(privateExtended);

      expect(privateNode).toEqual(node);
    });

    test(`derived public chain matches private chain - seed ${index}`, () => {
      const node = crypto.parseMasterSeed(seed);
      const privateExtended = crypto.serializeHDNode(node, true);
      const publicExtended = crypto.serializeHDNode(node, false);

      const privateNode = crypto.parseExtendedKey(privateExtended);
      const publicNode = crypto.parseExtendedKey(publicExtended);

      const privateChild = crypto.deriveChildKey(privateNode, 0, false);
      const publicChild = crypto.deriveChildKey(publicNode, 0, false);

      expect(privateChild.publicKey).toEqual(publicChild.publicKey);
    });
  });
});
