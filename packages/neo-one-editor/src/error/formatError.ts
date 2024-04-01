import { RemoteEngine } from '../engine/remote';
import { map } from './map';
import { parse } from './parse';

export const formatError = async (engine: RemoteEngine, error: Error) => {
  const parsed = parse(error);
  const frames = await map(engine, parsed);
  const stack = frames.length === 0 ? '' : `    ${frames.map((frame) => frame.toMappedString()).join('\n    ')}`;

  return `${error.message}${stack === '' ? '' : `\n${stack}`}`;
};
