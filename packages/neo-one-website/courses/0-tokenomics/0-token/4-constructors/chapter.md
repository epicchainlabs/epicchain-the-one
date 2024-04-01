# Chapter 5: Constructors

In this chapter we'll learn about NEO•ONE smart contract constructors which enable contract initialization. We'll also talk about verifying the calling `Address`, i.e. who invoked the smart contract.

## Learn

So far we've been using an implicit constructor by defining class properties with values. We can also declare a constructor to run arbitrary logic when the smart contract is deployed. Recall that the constructor is called exactly once when the smart contract is deployed.

Let's take a look at an example:

```typescript
import { Address, Deploy, SmartContract } from '@neo-one/smart-contract';

export class Example extends SmartContract {
  private readonly myStringProperty: string;

  public constructor(public readonly owner: Address = Deploy.senderAddress, stringValue: string = 'foo') {
    super();
    this.myStringProperty = `${stringValue}bar`;
    if (!Address.isCaller(owner)) {
      throw new Error('Expected caller to be the owner');
    }
  }
}
```

Here we've defined a constructor that takes two arguments, an `Address` [parameter property](https://www.typescriptlang.org/docs/handbook/classes.html#parameter-properties) that will be the `owner` of the contract and a `stringValue` which we manipulate and set the `myStringProperty` to. The first thing you might notice is that we provide [default](https://www.typescriptlang.org/docs/handbook/functions.html#optional-and-default-parameters) values for every constructor argument. This is mandatory in NEO•ONE smart contracts because we use these default values when we automatically deploy your smart contract for automated and local manual testing. Since we also use a generated address to deploy the contract, referred to as the `masterAccountID` in tests and elsewhere, NEO•ONE provides a special value `Deploy.senderAddress` that sets the default value to whichever address deployed the contract.

`Address.isCaller` allows you to determine if the provided `Address` invoked this contract. In this example, we do a sanity check that the `owner` is the one who deployed the smart contract, which eliminates the possibility of accidentally setting the `owner` to an address that the publisher of the smart contract doesn't own.

## Instructions

In future chapters we'll want to verify that the smart contract caller is the owner of the contract:

  1. Add a constructor with a single parameter property, `owner`, just like in the example above.
  2. Add the `Address.isCaller` sanity check.

## Test

By now you should know the drill - build and run the tests! If all goes well, go ahead and click the `Next` button. This chapter's tests are identical to the previous chapter because `withContracts` automatically deploys the contract to a local private network using the default arguments before passing the contract (as `token`) to our test method.

## Wrap Up

In this chapter we covered constructors, which allow arbitrary initialization logic, as well as how to verify the invoker of the smart contract. As usual, don't forget to check the tests to see the new check for the `owner` property. Notice the usage of `masterAccountID`. This is the account that automatically publishes and deploys the smart contract behind the scenes.
