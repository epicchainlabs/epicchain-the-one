import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';
import { ConsoleLog } from './log';

class ConsoleInterface extends BuiltinInterface {}
class ConsoleValue extends BuiltinValueObject {
  public readonly type = 'Console';
}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Console', new ConsoleInterface());
  builtins.addGlobalMember('Console', 'log', new ConsoleLog());
  builtins.addValue('console', new ConsoleValue());
};
