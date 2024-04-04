/// <reference types="monaco-editor/monaco" />
import { map, switchMap } from 'rxjs/operators';
import ts from 'typescript';
import { Adapter } from './Adapter';
import { convertTextChange, positionToOffset } from './utils';

export class FormatOnTypeAdapter extends Adapter implements monaco.languages.OnTypeFormattingEditProvider {
  public get autoFormatTriggerCharacters() {
    return [';', '}', '\n'];
  }

  public provideOnTypeFormattingEdits(
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    ch: string,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken,
    // tslint:disable-next-line:readonly-array
  ): monaco.Thenable<monaco.languages.TextEdit[]> {
    const resource = model.uri;

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(
          async (worker): Promise<readonly ts.TextChange[]> =>
            model.isDisposed()
              ? []
              : worker.getFormattingEditsAfterKeystroke(resource.path, positionToOffset(model, position), ch, options),
        ),
        map((edits) => (model.isDisposed() ? [] : edits.map((edit) => convertTextChange(model, edit)))),
      ),
    );
  }
}
