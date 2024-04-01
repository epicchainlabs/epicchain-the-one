import * as path from 'path';
import webpack from 'webpack';
import { Stage } from '../types';
import { common } from './common';
import { plugins } from './plugins';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');
const EDITOR_PACKAGE = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-editor');
const DIST_DIR = path.resolve(APP_ROOT_DIR, 'dist', 'workers');
const LOCAL_BROWSER_WORKER_PACKAGE = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-local-browser-worker');
const NODE_BROWSER_WORKER_PACKAGE = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-node-browser-worker');

export const workers = ({ stage }: { readonly stage: Stage }): webpack.Configuration => ({
  ...common({ stage, bundle: 'workers' }),
  entry:
    stage === 'prod'
      ? {
          'builder.worker': path.resolve(LOCAL_BROWSER_WORKER_PACKAGE, 'src', 'builder.worker.ts'),
          'fs.worker': path.resolve(LOCAL_BROWSER_WORKER_PACKAGE, 'src', 'fs.worker.ts'),
          'jsonRPCLocalProvider.worker': path.resolve(
            NODE_BROWSER_WORKER_PACKAGE,
            'src',
            'jsonRPCLocalProvider.worker.ts',
          ),
          'ts.worker': path.resolve(EDITOR_PACKAGE, 'src', 'monaco', 'ts.worker.ts'),
          'transpiler.worker': path.resolve(
            EDITOR_PACKAGE,
            'src',
            'engine',
            'main',
            'transpile',
            'transpiler.worker.ts',
          ),
          'editor.worker': path.resolve(EDITOR_PACKAGE, 'src', 'monaco', 'editor.worker.ts'),
          'html.worker': path.resolve(EDITOR_PACKAGE, 'src', 'monaco', 'html.worker.ts'),
          'json.worker': path.resolve(EDITOR_PACKAGE, 'src', 'monaco', 'json.worker.ts'),
        }
      : // async chunks seem broken with webpack dev server in workers
        {
          'builder.worker': path.resolve(LOCAL_BROWSER_WORKER_PACKAGE, 'src', 'builder.init.ts'),
          'fs.worker': path.resolve(LOCAL_BROWSER_WORKER_PACKAGE, 'src', 'fs.init.ts'),
          'jsonRPCLocalProvider.worker': path.resolve(
            NODE_BROWSER_WORKER_PACKAGE,
            'src',
            'jsonRPCLocalProvider.init.ts',
          ),
          'ts.worker': path.resolve(EDITOR_PACKAGE, 'src', 'monaco', 'ts.init.ts'),
          'transpiler.worker': path.resolve(EDITOR_PACKAGE, 'src', 'engine', 'main', 'transpile', 'transpiler.init.ts'),
          'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker',
          'html.worker': 'monaco-editor/esm/vs/language/html/html.worker',
          'json.worker': 'monaco-editor/esm/vs/language/json/json.worker',
        },
  target: 'webworker',
  output: {
    path: DIST_DIR,
    filename: '[name].js',
    chunkFilename: 'workers.[name].[chunkHash:8].js',
  },
  plugins: plugins({ stage, bundle: 'workers' }),
});
