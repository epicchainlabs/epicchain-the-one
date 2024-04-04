const addErrorCode = (error: Error, code: string) => {
  // tslint:disable-next-line no-object-mutation no-any
  (error as any).code = code;

  return error;
};

export const createENOENT = (path: string) => {
  const error = new Error(`no such file or directory: ${path}`);

  return addErrorCode(error, 'ENOENT');
};

export const createENOTDIR = (path: string) => {
  const error = new Error(`not a directory: ${path}`);

  return addErrorCode(error, 'ENOTDIR');
};
