import styled from '@emotion/styled';
import { Box, prop, switchProp } from '@neo-one/react-common';

export const ContentWrapper = styled(Box)<{ readonly bg: string }>`
  display: grid;
  /* stylelint-disable-next-line */
  background-color: ${switchProp('bg', {
    light: prop('theme.gray0'),
    darkLight: prop('theme.gray2'),
    gray5: prop('theme.gray5'),
    dark: prop('theme.black'),
  })};
  /* stylelint-disable-next-line */
  color: ${switchProp('bg', {
    dark: prop('theme.gray0'),
    light: prop('theme.gray6'),
    darkLight: prop('theme.gray6'),
    gray5: prop('theme.gray0'),
  })};
  padding: 16px;
  width: 100%;
  justify-items: center;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    padding: 8px;
  }
`;
