---
slug: user-accounts
title: User Accounts
---

NEO•ONE client APIs revolve around the concept of user accounts which represent a single address controlled by the user of the dapp.

The `Client` class is an abstraction layer over `UserAccountProvider`s which implement the core logic. By using the `Client` class and the generated smart contract APIs throughout your dapp, you can ensure that your business logic is independent of the underlying `UserAccountProvider`s.

---

[[toc]]

---

## Client Configuration

The `createClient` helper function generated by the NEO•ONE toolchain is configured with a `LocalUserAccountProvider` backed by an in-memory `LocalKeyStore` by default. This can be easily configured by passing in a callback of the form:

```typescript
(provider: NEOONEProvider) => { [name: string]: UserAccountProvider }
```

This callback will be passed a default `NEOONEProvider` that's been configured to work with your local private network as well as public nodes for the TestNet and MainNet. The return value will be used to configure the `Client`.

::: warning

Tip

You can configure the `Client` to only work with external wallets provided by an extension or a dapp browser by checking `process.env.NODE_ENV === 'production'` and returning a subset of the `UserAccountProvider`s used during development.

:::

Let's take a look at an example:

```typescript
const getUserAccountProviders = (provider: NEOONEProvider) => {
  const dapp = new DappBrowserUserAccountProvider();
  const extension = new BrowserExtensionUserAccountProvider();
  const other = new SomeOtherWalletProvider();
  if (process.env.NODE_ENV === 'production') {
    return { dapp, extension, other };
  }

  const memory = new LocalUserAccountProvider({
    keystore: new LocalKeyStore(new LocalMemoryStore()),
    provider,
  });

  return { dapp, extension, other, memory };
};

const client = createClient(getUserAccountProviders);
```

This would configure a `Client` that knows how to communicate with a dapp browser (e.g. nOS), a browser extension (e.g. NEX) and some other integration provided by `SomeOtherWalletProvider`. In production, it would only communicate with those providers, while in development we've additionally configured a `LocalUserAccountProvider` with an in-memory `LocalKeyStore` for use in testing.

::: warning

Note

In order to take advantage of the automatic local network configuration and pre-configured wallets, you must configure a `LocalUserAccountProvider` using the argument `provider` and an in-memory keystore, like the above example.

:::

---

## LocalUserAccountProvider

`LocalUserAccountProvider` is a completely local to the application `UserAccountProvider` which directly connects to NEO•ONE RPC nodes in order to process read requests as well as create and send transactions. `LocalUserAccountProvider` must be configured with a `KeyStore` instance and a `Provider` instance. The `KeyStore` interface abstracts over `UserAccount`s, selecting them, getting the current one, as well as signing a message with a specified `UserAccount`. The `Provider` interface abstracts over specific RPC requests the `LocalUserAccountProvider` requires to function.

In the example above, we've configured it to use a `LocalKeyStore` which is backed by a `LocalMemoryStore` which provides `UserAccount`s via an in-memory store. `LocalKeyStore` can be configured with any object that implements the `Store` interface and can be easily backed by persistent storage in files or within browser local storage:

```typescript
import localforage from 'localforage';

const localStorage = new LocalUserAccountProvider({
  keystore: new LocalKeyStore(new LocalStringStore(localforage)),
  provider,
});
```

NEO•ONE currently also supports a `LedgerKeyStore`, which enables connecting to ledger devices in both NodeJS-like environments and browser-like environments.

```typescript
const ledger = new LocalUserAccountProvider({
  keystore: new LedgerKeyStore(provider),
  provider,
});
```

---

## UserAccount and UserAccountID

`UserAccount` is the main abstraction used to define the user's available accounts for signing transactions. It contains three properties:

```typescript
interface UserAccount {
  /**
   * Uniquely identifies a `UserAccount` by its address and the network its used on.
   */
  readonly id: UserAccountID;
  /**
   * The name to use when displaying this account in a user-facing UI. Can be a user configured name or just the address.
   */
  readonly name: string;
  /**
   * The public key for the address.
   */
  readonly publicKey: PublicKeyString;
  /**
   * The signature redemption contract of the account.
   */
  readonly contract: AccountContract;
}
```

`UserAccountID` is used throughout the `@neo-one/client` APIs to specify a particular account to take an action with. For example, all of the smart contract APIs accept an options object as the last parameter that can specify a `from` `UserAccountID` to invoke a method with.

---

## Integrating With NEO•ONE

Want to integrate your wallet with NEO•ONE? Then this section is for you. The best way to integrate is to use the NEO•ONE client APIs with a `LocalUserAccountProvider` within your wallet. As described above, the `LocalUserAccountProvider` can be customized with specific `KeyStore` implementations that should satisfy the majority of wallet use-cases.

Once you've done that, come talk to us on [Discord](https://discord.gg/S86PqDE). The integration is currently a work in progress, but it's coming very soon.