import { ABIReturn } from '@neo-one/client-common';
import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DEFAULT_DIAGNOSTIC_OPTIONS, DiagnosticOptions } from '../analysis';
import {
  isOnlyArray,
  isOnlyBoolean,
  isOnlyBuffer,
  isOnlyForwardValue,
  isOnlyMap,
  isOnlyObject,
  isOnlyString,
} from '../compile/helper/types';
import { Context } from '../Context';
import { DiagnosticCode } from '../DiagnosticCode';
import { DiagnosticMessage } from '../DiagnosticMessage';
import { getFixedDecimals } from './getFixedDecimals';
import { getForwardedValueType } from './getForwardedValueType';

export function toABIReturn(
  context: Context,
  node: ts.Node,
  type: ts.Type | undefined,
  optionalIn = false,
  options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
): ABIReturn | undefined {
  let resolvedType = type;
  if (resolvedType === undefined) {
    return undefined;
  }

  if (tsUtils.type_.isOnlyVoidish(resolvedType)) {
    return { type: 'Void', optional: false };
  }

  let optional = optionalIn;
  if (tsUtils.type_.hasUndefinedish(resolvedType)) {
    resolvedType = tsUtils.type_.getNonNullableType(resolvedType);
    optional = true;
  }

  let forwardedValue = false;
  if (context.builtins.isType(node, resolvedType, 'ForwardedValue')) {
    resolvedType = getForwardedValueType(resolvedType);
    forwardedValue = true;
  }

  if (resolvedType === undefined) {
    return undefined;
  }

  if (tsUtils.type_.hasUndefinedish(resolvedType)) {
    resolvedType = tsUtils.type_.getNonNullableType(resolvedType);
    optional = true;
  }

  resolvedType = context.analysis.getNotAnyType(node, resolvedType);
  if (resolvedType === undefined) {
    return undefined;
  }

  if (isOnlyBoolean(context, node, resolvedType)) {
    return { type: 'Boolean', optional, forwardedValue };
  }

  if (context.builtins.isInterface(node, resolvedType, 'Address')) {
    return { type: 'Address', optional, forwardedValue };
  }

  if (context.builtins.isInterface(node, resolvedType, 'Hash256')) {
    return { type: 'Hash256', optional, forwardedValue };
  }

  if (context.builtins.isInterface(node, resolvedType, 'PublicKey')) {
    return { type: 'PublicKey', optional, forwardedValue };
  }

  if (isOnlyString(context, node, resolvedType)) {
    return { type: 'String', optional, forwardedValue };
  }

  if (tsUtils.type_.isOnlyNumberLiteral(resolvedType)) {
    return { type: 'Integer', optional, decimals: 0, forwardedValue };
  }

  if (context.builtins.isType(node, resolvedType, 'Fixed')) {
    const decimals = getFixedDecimals(resolvedType);

    return { type: 'Integer', optional, decimals: decimals === undefined ? 0 : decimals, forwardedValue };
  }

  if (tsUtils.type_.isOnlyNumberish(resolvedType)) {
    return { type: 'Integer', optional, decimals: 0, forwardedValue };
  }

  if (isOnlyArray(context, node, resolvedType)) {
    const typeArguments = tsUtils.type_.getTypeArguments(resolvedType);
    if (typeArguments !== undefined) {
      const value = toABIReturn(context, node, typeArguments[0]);
      if (value !== undefined) {
        return { type: 'Array', optional, value, forwardedValue };
      }
    }
  }

  if (isOnlyMap(context, node, resolvedType)) {
    const typeArguments = tsUtils.type_.getTypeArguments(resolvedType);
    if (typeArguments !== undefined && typeArguments.length === 2) {
      const key = toABIReturn(context, node, typeArguments[0]);
      const value = toABIReturn(context, node, typeArguments[1]);
      if (key !== undefined && value !== undefined) {
        return { type: 'Map', optional, key, value, forwardedValue };
      }
    }
  }

  if (isOnlyBuffer(context, node, resolvedType)) {
    return { type: 'Buffer', optional, forwardedValue };
  }

  if (isOnlyForwardValue(context, node, resolvedType)) {
    return { type: 'ForwardValue', optional, forwardedValue };
  }

  if (isOnlyObject(context, node, resolvedType)) {
    const properties = tsUtils.type_.getProperties(resolvedType).reduce<{ [key: string]: ABIReturn }>((acc, prop) => {
      const propType = context.analysis.getTypeOfSymbol(prop, node);
      const decls = tsUtils.symbol.getDeclarations(prop);
      const nextNode = decls.length === 0 ? node : decls[0];
      if (!ts.isPropertyDeclaration(nextNode) && !ts.isPropertySignature(nextNode)) {
        if (options.error) {
          context.reportError(nextNode, DiagnosticCode.InvalidContractType, DiagnosticMessage.InvalidContractType);
        } else if (options.warning) {
          context.reportWarning(nextNode, DiagnosticCode.InvalidContractType, DiagnosticMessage.InvalidContractType);
        }

        return acc;
      }

      const returnType = toABIReturn(context, nextNode, propType);

      return returnType === undefined ? acc : { ...acc, [tsUtils.symbol.getName(prop)]: returnType };
    }, {});

    return {
      type: 'Object',
      optional,
      forwardedValue,
      properties,
    };
  }

  if (options.error) {
    context.reportError(node, DiagnosticCode.InvalidContractType, DiagnosticMessage.InvalidContractType);
  } else if (options.warning) {
    context.reportWarning(node, DiagnosticCode.InvalidContractType, DiagnosticMessage.InvalidContractType);
  }

  return undefined;
}
