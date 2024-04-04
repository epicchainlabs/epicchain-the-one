// tslint:disable-next-line no-import-side-effect
import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { AdjacentInfo, SectionData } from '../../types';
import { LayoutWrapper } from '../common';
import { Helmet } from '../Helmet';
import { ReferenceItem } from '../reference';
import { DocFooter } from './DocFooter';
import { MainContent } from './MainContent';
import { Sidebar } from './Sidebar';
import { Author } from './types';

const StyledGrid = styled(Box)`
  display: grid;
  grid-gap: 0;
  justify-items: center;
`;

export interface MarkdownContent {
  readonly type: 'markdown';
  readonly value: string;
}

export interface ReferenceItemContent {
  readonly type: 'referenceItem';
  readonly value: ReferenceItem;
}

export interface ReferenceItemPageData {
  readonly title: string;
  readonly slug: string;
  readonly content: ReferenceItemContent;
  readonly current: string;
  readonly sidebar: readonly SectionData[];
}

export interface ReferenceItemsContent {
  readonly type: 'referenceItems';
  readonly value: readonly ReferenceItemPageData[];
}

export type ContentType = MarkdownContent | ReferenceItemContent | ReferenceItemsContent;

interface Props {
  readonly current: string;
  readonly sidebarAlwaysVisible: boolean;
  readonly title: string;
  readonly content: ContentType;
  readonly sidebar: readonly SectionData[];
  readonly date?: string;
  readonly link: string;
  readonly author?: Author;
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

export const Content = ({
  title,
  current,
  sidebarAlwaysVisible,
  content,
  next,
  previous,
  sidebar,
  date,
  link,
  author,
  ...props
}: Props) => (
  <StyledGrid {...props}>
    <Helmet title={`${title} - NEO•ONE`} />
    <LayoutWrapper omitSpacer>
      <MainContent content={content} title={title} date={date} link={link} author={author} />
      <Sidebar current={current} sections={sidebar} alwaysVisible={sidebarAlwaysVisible} />
    </LayoutWrapper>
    <DocFooter next={next} previous={previous} />
  </StyledGrid>
);
