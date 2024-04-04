import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { isBuiltinNew, isBuiltinValue } from '../builtins';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class IdentifierCompiler extends NodeCompiler<ts.Identifier> {
  public readonly kind = ts.SyntaxKind.Identifier;

  public visitNode(sb: ScriptBuilder, expr: ts.Identifier, options: VisitOptions): void {
    const builtin = sb.context.builtins.getValue(expr);
    if (builtin !== undefined) {
      if (!isBuiltinValue(builtin)) {
        if (
          (isBuiltinNew(builtin) && options.superClass !== undefined) ||
          sb.context.builtins.isValue(expr, 'one0') ||
          sb.context.builtins.isValue(expr, 'one1')
        ) {
          sb.context.reportError(
            expr,
            DiagnosticCode.InvalidBuiltinReference,
            DiagnosticMessage.CannotReferenceBuiltin,
          );
        }

        if (options.pushValue) {
          sb.emitHelper(expr, options, sb.helpers.wrapUndefined);
        }

        return;
      }

      builtin.emitValue(sb, expr, options);

      return;
    }

    const symbol = sb.context.analysis.getSymbol(expr);
    if (symbol !== undefined && tsUtils.symbol.isArgumentsSymbol(sb.context.typeChecker, symbol)) {
      sb.context.reportError(expr, DiagnosticCode.InvalidBuiltinReference, DiagnosticMessage.CannotReferenceBuiltin);

      return;
    }

    if (options.setValue) {
      sb.scope.set(sb, expr, sb.noSetValueOptions(options), expr.getText());
    }

    if (options.pushValue) {
      if (tsUtils.identifier.isUndefined(expr)) {
        sb.emitHelper(expr, options, sb.helpers.wrapUndefined);
      } else {
        sb.scope.get(sb, expr, options, expr.getText());
      }
    }
  }
}
