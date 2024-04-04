import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { FileDiagnostic, TextRange } from '../types';
import { Problem } from './Problem';

const Wrapper = styled(Box)`
  display: grid;
  width: 100%;
`;

interface Props {
  readonly path: string;
  readonly problems: readonly FileDiagnostic[];
  readonly onSelectRange: (path: string, range: TextRange) => void;
}

export const ProblemList = ({ path, problems, onSelectRange, ...props }: Props) => (
  <Wrapper {...props}>
    {problems.map((problem, idx) => (
      <Problem key={idx} path={path} problem={problem} onSelectRange={onSelectRange} />
    ))}
  </Wrapper>
);
