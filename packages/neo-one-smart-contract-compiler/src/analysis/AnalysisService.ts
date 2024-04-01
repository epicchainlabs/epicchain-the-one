import { addressToScriptHash, common, ECPoint, UInt160, UInt256 } from '@neo-one/client-common';
import { AnyNameableNode, symbolKey, tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import {
  isOnlyArray,
  isOnlyBoolean,
  isOnlyBuffer,
  isOnlyMap,
  isOnlyNull,
  isOnlyNumber,
  isOnlySet,
  isOnlyString,
  isOnlySymbol,
  isOnlyUndefined,
} from '../compile/helper/types';
import { Context } from '../Context';
import { DiagnosticCode } from '../DiagnosticCode';
import { DiagnosticMessage } from '../DiagnosticMessage';
import { createMemoized, nodeKey, typeKey } from '../utils';

export interface ErrorDiagnosticOptions {
  readonly error?: boolean;
}

export interface DiagnosticOptions extends ErrorDiagnosticOptions {
  readonly warning?: boolean;
}

export const DEFAULT_DIAGNOSTIC_OPTIONS = {
  error: true,
  warning: false,
};

export interface SignatureTypes {
  readonly paramDecls: ReadonlyArray<ts.ParameterDeclaration>;
  readonly paramTypes: Map<ts.ParameterDeclaration, ts.Type | undefined>;
  readonly returnType: ts.Type | undefined;
}

export class AnalysisService {
  private readonly memoized = createMemoized();
  public constructor(private readonly context: Context) {}

  public getFunctionReturnType(
    node: ts.SignatureDeclaration,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ts.Type | undefined {
    if (ts.isAccessor(node)) {
      return this.getType(node);
    }

    const typeNode = tsUtils.type_.getTypeNode(node) as ts.TypeNode | undefined;
    if (typeNode !== undefined) {
      return this.getNotAnyType(typeNode, tsUtils.type_.getTypeFromTypeNode(this.context.typeChecker, typeNode));
    }

    const signatureTypes = this.extractSignature(node, options);

    return signatureTypes === undefined ? undefined : signatureTypes.returnType;
  }

  public extractAllSignatures(
    node: ts.Node,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ReadonlyArray<SignatureTypes> {
    return this.extractAllSignaturesForType(node, this.getType(node), options);
  }

  public extractSignature(
    node: ts.Node,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): SignatureTypes | undefined {
    return this.extractSignatureForType(node, this.getType(node), options);
  }

  public getSignatures(node: ts.CallLikeExpression): ReadonlyArray<ts.Signature> | undefined {
    const signature = this.context.typeChecker.getResolvedSignature(node);
    if (signature !== undefined && !tsUtils.signature.isFailure(signature)) {
      return [signature];
    }
    const expr = tsUtils.expression.getExpressionForCall(node);
    const type = this.getType(expr);
    if (type === undefined) {
      return undefined;
    }

    return tsUtils.type_.getCallSignatures(type);
  }

  public extractAllSignaturesForType(
    node: ts.Node,
    type: ts.Type | undefined,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ReadonlyArray<SignatureTypes> {
    const signatures = type === undefined ? undefined : tsUtils.type_.getCallSignatures(type);
    if (signatures === undefined) {
      return [];
    }

    return signatures.map((signature) => this.extractSignatureTypes(node, signature, options)).filter(utils.notNull);
  }

  public extractSignatureForType(
    node: ts.Node,
    type: ts.Type | undefined,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): SignatureTypes | undefined {
    const signatureTypes = this.extractAllSignaturesForType(node, type, options);
    if (signatureTypes.length === 0) {
      return undefined;
    }

    if (signatureTypes.length !== 1) {
      this.report(options, node, DiagnosticCode.MultipleSignatures, DiagnosticMessage.MultipleSignatures);

      return undefined;
    }

    return signatureTypes[0];
  }

  public extractSignaturesForCall(
    node: ts.CallLikeExpression,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ReadonlyArray<SignatureTypes> | undefined {
    const signatures = this.getSignatures(node);
    if (signatures === undefined) {
      return undefined;
    }

    return signatures.map((signature) => this.extractSignatureTypes(node, signature, options)).filter(utils.notNull);
  }

  public extractSignatureTypes(
    node: ts.Node,
    signature: ts.Signature,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): SignatureTypes | undefined {
    const params = tsUtils.signature.getParameters(signature);
    const paramTypes = params.map((param) => this.getTypeOfSymbol(param, node));
    const paramDeclsNullable = params.map((param) => tsUtils.symbol.getValueDeclaration(param));
    const nullParamIndex = paramDeclsNullable.indexOf(undefined);
    if (nullParamIndex !== -1) {
      /* istanbul ignore next */
      const nullParam = params[nullParamIndex];
      /* istanbul ignore next */
      this.report(
        options,
        node,
        DiagnosticCode.Invariant,
        DiagnosticMessage.MissingParameterDeclaration,
        tsUtils.symbol.getName(nullParam),
      );

      /* istanbul ignore next */
      return undefined;
    }

    const paramDecls = paramDeclsNullable.filter(utils.notNull).filter(ts.isParameter);

    const declToType = new Map<ts.ParameterDeclaration, ts.Type | undefined>();
    // tslint:disable-next-line no-loop-statement
    for (const [paramDecl, paramType] of utils.zip(paramDecls, paramTypes)) {
      declToType.set(paramDecl, paramType);
    }

    return {
      paramDecls,
      paramTypes: declToType,
      returnType: this.getNotAnyType(node, tsUtils.signature.getReturnType(signature)),
    };
  }

  public extractLiteralAddress(original: ts.Expression): UInt160 | undefined {
    return this.memoized('extract-literal-address', nodeKey(original), () =>
      this.extractLiteral(
        original,
        'AddressConstructor',
        (value) => {
          try {
            return common.stringToUInt160(addressToScriptHash(value));
          } catch {
            return common.stringToUInt160(value);
          }
        },
        common.bufferToUInt160,
      ),
    );
  }

  public extractLiteralHash256(original: ts.Expression): UInt256 | undefined {
    return this.extractLiteral(original, 'Hash256Constructor', common.stringToUInt256, common.bufferToUInt256);
  }

  public extractLiteralPublicKey(original: ts.Expression): ECPoint | undefined {
    return this.extractLiteral(original, 'PublicKeyConstructor', common.stringToECPoint, common.bufferToECPoint);
  }

  public getType(node: ts.Node, options: ErrorDiagnosticOptions = {}): ts.Type | undefined {
    return this.memoized('get-type', nodeKey(node), () =>
      this.getNotAnyType(node, tsUtils.type_.getType(this.context.typeChecker, node), options),
    );
  }

  public getTypeOfSymbol(symbol: ts.Symbol | undefined, node: ts.Node): ts.Type | undefined {
    if (symbol === undefined) {
      return undefined;
    }

    return this.memoized('get-type-of-symbol', `${symbolKey(symbol)}:${nodeKey(node)}`, () =>
      this.getNotAnyType(node, tsUtils.type_.getTypeAtLocation(this.context.typeChecker, symbol, node)),
    );
  }

  public getSymbol(node: ts.Node): ts.Symbol | undefined {
    return this.memoized('symbol', nodeKey(node), () => {
      const symbol = tsUtils.node.getSymbol(this.context.typeChecker, node);
      if (symbol === undefined) {
        return undefined;
      }

      const aliased = tsUtils.symbol.getAliasedSymbol(this.context.typeChecker, symbol);
      if (aliased !== undefined) {
        return aliased;
      }

      return symbol;
    });
  }

  public getTypeSymbol(node: ts.Node): ts.Symbol | undefined {
    return this.memoized('get-type-symbol', nodeKey(node), () => {
      const type = this.getType(node);

      return this.getSymbolForType(node, type);
    });
  }

  public getSymbolForType(_node: ts.Node, type: ts.Type | undefined): ts.Symbol | undefined {
    if (type === undefined) {
      return undefined;
    }

    return this.memoized('get-symbol-for-type', typeKey(type), () => {
      let symbol = tsUtils.type_.getAliasSymbol(type);
      if (symbol === undefined) {
        symbol = tsUtils.type_.getSymbol(type);
      }

      if (symbol === undefined) {
        return undefined;
      }

      const aliased = tsUtils.symbol.getAliasedSymbol(this.context.typeChecker, symbol);
      if (aliased !== undefined) {
        return aliased;
      }

      return symbol;
    });
  }

  public getNotAnyType(
    node: ts.Node,
    type: ts.Type | undefined,
    { error = true }: ErrorDiagnosticOptions = {},
  ): ts.Type | undefined {
    if (type !== undefined && tsUtils.type_.isAny(type)) {
      if (error && !tsUtils.type_.isErrorType(type)) {
        this.context.reportTypeError(node);
      }

      return undefined;
    }

    if (type !== undefined) {
      const constraintType = tsUtils.type_.getConstraint(type);
      if (constraintType !== undefined) {
        return constraintType;
      }
    }

    return type;
  }

  public extractStorageKey(node: ts.Node): string | undefined {
    return this.memoized('extract-storage-key', nodeKey(node), () => {
      const smartContract = tsUtils.node.getFirstAncestorByTest(node, ts.isClassDeclaration);
      if (smartContract === undefined || !this.isSmartContract(smartContract)) {
        return undefined;
      }

      const decl = tsUtils.node.getFirstAncestorByTest(node, ts.isPropertyDeclaration);
      if (decl === undefined) {
        return undefined;
      }

      return tsUtils.node.getName(decl);
    });
  }

  public isSmartContract(node: ts.ClassDeclaration): boolean {
    return this.memoized('is-smart-contract', nodeKey(node), () => {
      const extendsExpr = tsUtils.class_.getExtends(node);

      const isSmartContract =
        extendsExpr !== undefined &&
        this.context.builtins.isValue(tsUtils.expression.getExpression(extendsExpr), 'SmartContract');

      if (isSmartContract) {
        return true;
      }

      const baseClasses = tsUtils.class_.getBaseClasses(this.context.typeChecker, node);
      if (baseClasses.some((value) => this.context.builtins.isValue(value, 'SmartContract'))) {
        return true;
      }

      const baseClass = tsUtils.class_.getBaseClass(this.context.typeChecker, node);

      return baseClass !== undefined && this.isSmartContract(baseClass);
    });
  }

  public isSmartContractNode(node: ts.Node): boolean {
    return this.memoized('is-smart-contract-node', nodeKey(node), () => {
      const symbol = this.getSymbol(node);
      if (symbol === undefined) {
        return false;
      }

      const decls = tsUtils.symbol.getDeclarations(symbol);
      if (decls.length === 0) {
        return false;
      }

      const decl = decls[0];

      return ts.isClassDeclaration(decl) && this.isSmartContract(decl);
    });
  }

  public getSymbolAndAllInheritedSymbols(node: ts.Node): ReadonlyArray<ts.Symbol> {
    return this.memoized('get-symbol-and-all-inherited-symbols', nodeKey(node), () => {
      const symbol = this.getSymbol(node);
      const symbols = [symbol].filter(utils.notNull);
      if (ts.isClassDeclaration(node) || ts.isClassExpression(node) || ts.isInterfaceDeclaration(node)) {
        const baseTypes = tsUtils.class_.getBaseTypesFlattened(this.context.typeChecker, node);

        return symbols.concat(baseTypes.map((baseType) => this.getSymbolForType(node, baseType)).filter(utils.notNull));
      }

      return symbols;
    });
  }

  public isValidStorageType(node: ts.Node, type: ts.Type): boolean {
    return !tsUtils.type_.hasType(
      type,
      (tpe) =>
        !tsUtils.type_.isOnlyType(
          tpe,
          (tp) =>
            isOnlyUndefined(this.context, node, tp) ||
            isOnlyNull(this.context, node, tp) ||
            isOnlyBoolean(this.context, node, tp) ||
            isOnlyNumber(this.context, node, tp) ||
            isOnlyString(this.context, node, tp) ||
            isOnlySymbol(this.context, node, tp) ||
            isOnlyBuffer(this.context, node, tp) ||
            this.isValidStorageArray(node, tp) ||
            this.isValidStorageMap(node, tp) ||
            this.isValidStorageSet(node, tp),
        ),
    );
  }

  public findReferencesAsNodes(node: AnyNameableNode | ts.Identifier): ReadonlyArray<ts.Node> {
    return this.memoized('find-references-as-nodes', nodeKey(node), () =>
      tsUtils.reference
        .findReferencesAsNodes(this.context.program, this.context.languageService, node)
        .filter((found) => this.context.sourceFiles.has(tsUtils.node.getSourceFile(found))),
    );
  }

  public isSmartContractMixinFunction(node: ts.FunctionDeclaration | ts.FunctionExpression): boolean {
    const parameters = tsUtils.parametered.getParameters(node);
    if (parameters.length !== 1) {
      return false;
    }

    const signatureTypess = this.extractAllSignatures(node);
    if (signatureTypess.length !== 1) {
      return false;
    }

    const signatureTypes = signatureTypess[0];
    const firstParam = signatureTypes.paramDecls[0];
    const firstParamType = signatureTypes.paramTypes.get(firstParam);
    if (firstParamType === undefined || tsUtils.type_.getConstructSignatures(firstParamType).length !== 1) {
      return false;
    }

    const constructSignatureTypes = this.extractSignatureTypes(
      firstParam,
      tsUtils.type_.getConstructSignatures(firstParamType)[0],
    );
    if (constructSignatureTypes === undefined) {
      return false;
    }

    const returnTypeSymbol = this.getSymbolForType(firstParam, constructSignatureTypes.returnType);

    return returnTypeSymbol !== undefined && returnTypeSymbol === this.context.builtins.getValueSymbol('SmartContract');
  }

  private isValidStorageArray(node: ts.Node, type: ts.Type): boolean {
    if (!isOnlyArray(this.context, node, type)) {
      return false;
    }

    const typeArguments = tsUtils.type_.getTypeArgumentsArray(type);
    if (typeArguments.length !== 1) {
      return true;
    }

    return this.isValidStorageType(node, typeArguments[0]);
  }

  private isValidStorageMap(node: ts.Node, type: ts.Type): boolean {
    if (!isOnlyMap(this.context, node, type)) {
      return false;
    }

    const typeArguments = tsUtils.type_.getTypeArgumentsArray(type);
    if (typeArguments.length !== 2) {
      return true;
    }

    return this.isValidStorageType(node, typeArguments[0]) && this.isValidStorageType(node, typeArguments[1]);
  }

  private isValidStorageSet(node: ts.Node, type: ts.Type): boolean {
    if (!isOnlySet(this.context, node, type)) {
      return false;
    }

    const typeArguments = tsUtils.type_.getTypeArgumentsArray(type);
    if (typeArguments.length !== 1) {
      return true;
    }

    return this.isValidStorageType(node, typeArguments[0]);
  }

  private extractLiteral<T>(
    original: ts.Expression,
    name: string,
    processText: (value: string) => T,
    processBuffer: (value: Buffer) => T,
  ): T | undefined {
    return this.traceIdentifier(original, (node) => {
      if (!ts.isCallExpression(node) && !ts.isTaggedTemplateExpression(node)) {
        return undefined;
      }

      const expr = ts.isCallExpression(node) ? tsUtils.expression.getExpression(node) : tsUtils.template.getTag(node);
      const symbol = this.getSymbol(expr);
      const hash256From = this.context.builtins.getOnlyMemberSymbol(name, 'from');
      const bufferFrom = this.context.builtins.getOnlyMemberSymbol('BufferConstructor', 'from');

      if (symbol === hash256From) {
        const arg = ts.isCallExpression(node)
          ? (tsUtils.argumented.getArguments(node)[0] as ts.Expression | undefined)
          : tsUtils.template.getTemplate(node);
        if (
          ts.isTaggedTemplateExpression(node) &&
          !ts.isNoSubstitutionTemplateLiteral(tsUtils.template.getTemplate(node))
        ) {
          return undefined;
        }
        if (arg === undefined) {
          return undefined;
        }

        return this.traceIdentifier(arg, (value) => {
          if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
            try {
              return processText(tsUtils.literal.getLiteralValue(value));
            } catch {
              // do nothing
            }
          }

          return undefined;
        });
      }

      if (symbol === bufferFrom && ts.isCallExpression(node)) {
        const arg = tsUtils.argumented.getArguments(node)[0] as ts.Expression | undefined;
        if (arg === undefined) {
          return undefined;
        }

        return this.traceIdentifier(arg, (value) => {
          if (!ts.isStringLiteral(value)) {
            return undefined;
          }

          try {
            return processBuffer(Buffer.from(tsUtils.literal.getLiteralValue(value), 'hex'));
          } catch {
            return undefined;
          }
        });
      }

      return undefined;
    });
  }

  private traceIdentifier<T>(
    nodeIn: ts.Expression,
    extractValue: (value: ts.Expression) => T | undefined,
  ): T | undefined {
    const node = this.unwrapExpression(nodeIn);

    if (ts.isIdentifier(node)) {
      const symbol = this.getSymbol(node);
      if (symbol === undefined) {
        return undefined;
      }

      const decl = tsUtils.symbol.getValueDeclaration(symbol);
      if (decl === undefined) {
        return undefined;
      }

      if (!ts.isVariableDeclaration(decl)) {
        return undefined;
      }

      const parent = tsUtils.node.getParent(decl);
      if (!ts.isVariableDeclarationList(parent) || !tsUtils.modifier.isConst(parent)) {
        return undefined;
      }

      const initializer = tsUtils.initializer.getInitializer(parent);
      if (initializer === undefined) {
        return undefined;
      }

      return this.traceIdentifier(initializer, extractValue);
    }

    return extractValue(node);
  }

  private unwrapExpression(node: ts.Expression): ts.Expression {
    if (ts.isParenthesizedExpression(node)) {
      return tsUtils.expression.getExpression(node);
    }

    if (ts.isAsExpression(node)) {
      return tsUtils.expression.getExpression(node);
    }

    return node;
  }

  private report(
    options: DiagnosticOptions,
    node: ts.Node,
    code: DiagnosticCode,
    message: DiagnosticMessage,
    // tslint:disable-next-line no-any readonly-array
    ...args: any[]
  ): void {
    if (options.error) {
      this.context.reportError(node, code, message, ...args);
    } else if (options.warning) {
      this.context.reportWarning(node, code, message, ...args);
    }
  }
}
