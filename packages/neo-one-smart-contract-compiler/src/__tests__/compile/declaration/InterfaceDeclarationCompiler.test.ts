import { helpers } from '../../../__data__';

describe('InterfaceDeclarationCompiler', () => {
  test('interface does not emit', async () => {
    await helpers.executeString(`
      interface Foo {
        bar: string;
      }

      const foo: Foo = { bar: 'bar' };

      if (foo.bar !== 'bar') {
        throw 'Failure';
      }
    `);
  });
});
