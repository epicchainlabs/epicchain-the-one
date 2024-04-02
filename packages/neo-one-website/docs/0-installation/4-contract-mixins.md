---
slug: contract-mixins
title: Contract Mixins
---

NEO•ONE provides mixins for common smart contract patterns.

This guide will walk you through how to use a mixin.

---

[[toc]]

---

## Requirements

Install the following packages if you have not done so:

```bash
yarn add @neo-one/cli@prerelease @neo-one/client@prerelease @neo-one/smart-contract@prerelease @neo-one/smart-contract-test@prerelease @neo-one/smart-contract-lib@prerelease @neo-one/smart-contract-typescript-plugin@prerelease
```

```bash
npm install @neo-one/cli@prerelease @neo-one/client@prerelease @neo-one/smart-contract@prerelease @neo-one/smart-contract-test@prerelease @neo-one/smart-contract-lib@prerelease @neo-one/smart-contract-typescript-plugin@prerelease
```

::: warning

Important

The package `@neo-one/smart-contract-lib` contains the mixins and is important to this guide.

:::

---

## What Is A Mixin?

A mixin is a class (abstract or non-abstract) in which some or all of its methods and/or properties are unimplemented.

We use mixin as a way to insert common properties and methods (sometimes required such as in the case of meeting a token standard) into your contract.

::: warning

Tip

You can think of our mixins as a template or a base where you can build your contracts on.

:::

---

## Usage

```typescript
import { SmartContract } from '@neo-one/smart-contract';
// import template of your choice from @neo-one/smart-contract-lib
import { XEP5Token } from '@neo-one/smart-contract-lib';
// Mixins
export class YourContract extends XEP5Token(SmartContract) {
  // 'SmartContract' here can be any other contract (abstract & non-abstract class) that extends SmartContract class
  // 'YourContract' inherits the methods and properties defined in XEP5TokenClass returned by XEP5Token
  // ... your smart contract code.
}
```

If you find the syntax `XEP5Token(SmartContract)` strange, checkout this page on [Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html) from the TypeScript Handbook for more details.

::: warning

Tip

We encourage you to look at the XEP5Token mixin to understand how we are implementing a XEP5 token. Go [here](https://github.com/neo-one-suite/neo-one/blob/master-2.x/packages/neo-one-smart-contract-lib/src/XEP5Token.ts) to see the source code for the XEP5Token mixin

:::

---

## Example

The following example set uses a mixin to design a new token that follows the XEP5 token standard.

::: warning

Note

A token standard simply defines a set of methods and properties that must exist in the token.

:::

`SimpleToken.ts`

SimpleToken is injected with `XEP5Token`'s methods and properties.

```typescript
import { Address, Fixed, SmartContract } from '@neo-one/smart-contract';
import { XEP5Token } from '@neo-one/smart-contract-lib';
export abstract class SimpleToken extends XEP5Token(SmartContract) {
  public readonly owner: Address;
  public readonly decimals: 8 = 8;
  public constructor(owner: Address, amount: Fixed<8>) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.owner = owner;
    this.issue(owner, amount);
  }
}
```

`BullToken.ts`

`BullToken` inherits methods and properties that adheres to the XEP5 token standard because of the mixin. It also inherits everything defined in `SimpleToken`.

```typescript
import { Address, Deploy, Fixed } from '@epicchain-the-one';
import { SimpleToken } from './SimpleToken';
export class BullToken extends SimpleToken {
  public readonly name: string = 'BullToken';
  public readonly symbol: string = 'BLT';
  public constructor(owner: Address = Deploy.senderAddress, amount: Fixed<8> = 1_000_000_00000000) {
    super(owner, amount);
  }
}
```

---

## Available Templates

- [XEP5Token](https://github.com/neo-one-suite/neo-one/blob/master-2.x/packages/neo-one-smart-contract-lib/src/XEP5Token.ts) - [XEP5 Token Standard](https://docs.epic-chain.org/tutorial/en-us/9-smartContract/What_is_XEP5.html)
- [ICO](https://github.com/neo-one-suite/neo-one/blob/master-2.x/packages/neo-one-smart-contract-lib/src/ICO.ts) - Initial Coin Offering.
- Ownership/[Ownable](https://github.com/neo-one-suite/neo-one/blob/master-2.x/packages/neo-one-smart-contract-lib/src/ownership/Ownable.ts) - This mixin provides a means to assign an address as the owner of a contract. Extending this class and adding `this.ownerOnly()`; to the beginning of all public functions will throw an error anytime an address other than the primary makes requests.
- Ownership/[Secondary](https://github.com/neo-one-suite/neo-one/blob/master-2.x/packages/neo-one-smart-contract-lib/src/ownership/Secondary.ts) - This mixin provides a means to mark an address as the primary caller of this contract. Extending this class and adding `this.primaryOnly()`; to the beginning of all public functions will throw an error anytime an address other than the primary makes requests.
