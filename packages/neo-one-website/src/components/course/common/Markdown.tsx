import styled from '@emotion/styled';
import { prop } from '@neo-one/react-common';
import { Markdown as MarkdownBase } from '../../../elements';

export const Markdown = styled(MarkdownBase)`
  color: ${prop('theme.gray0')};
  padding: 16px;
  margin: 0;
`;
