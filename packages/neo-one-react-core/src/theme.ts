import { css } from '@emotion/core';

const backup: readonly string[] = [
  '-apple-system',
  'system-ui',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Oxygen',
  'Ubuntu',
  'Cantarell',
  'Fira Sans',
  'Droid Sans',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
];

export const axiforma = (font: string) =>
  [font, 'Questrial']
    .concat(backup)
    .map((f) => `"${f}"`)
    .join(', ');

export interface Props {
  readonly theme: typeof theme;
}

export const theme = {
  primary: '#00FF9C',
  secondary: '#205C3B',
  primaryDark: '#00d180',
  primaryLight: '#00FF9C',
  black: '#2E2837',
  lightBlack: '#322B3D',
  accent: '#9B98F6',
  error: '#FF466A',
  warning: '#FFC400',
  gray0: '#F8F5FD',
  grayHalf: '#F2EEF7',
  gray1: '#F2EAFE',
  gray2: '#CCBEE0',
  gray3: '#8E82A3',
  gray4: '#5B506B',
  gray5: '#40384C',
  gray6: '#362E43',
  hover: '#00d180',
  fonts: {
    axiformaBold: css`
      font-family: ${axiforma('Axiforma-Bold')};
      font-style: normal;
      font-weight: 700;
    `,
    axiformaRegular: css`
      font-family: ${axiforma('Axiforma-Regular')};
      font-style: normal;
      font-weight: 400;
    `,
    axiformaMedium: css`
      font-family: ${axiforma('Axiforma-Medium')};
      font-style: normal;
      font-weight: 500;
    `,
    axiformaSemiBold: css`
      font-family: ${axiforma('Axiforma-SemiBold')};
      font-weight: 600;
      font-style: normal;
    `,
    axiformaBook: css`
      font-family: ${axiforma('Axiforma-Book')};
      font-weight: 200;
      font-style: normal;
    `,
    axiformaThin: css`
      font-family: ${axiforma('Axiforma-Thin')};
      font-weight: 400;
      font-style: normal;
    `,
  },
  fontStyles: {
    caption: css`
      font-size: 0.8rem;
      line-height: 1.35em;
      text-align: left;
    `,
    body1: css`
      font-size: 0.875rem;
      line-height: 1.46428em;
      text-align: left;
    `,
    body2: css`
      font-size: 0.875rem;
      line-height: 1.71428em;
      text-align: left;
    `,
    display1: css`
      font-size: 2.125rem;
      line-height: 1.20588em;
      text-align: left;
    `,
    display2: css`
      font-size: 2.8125rem;
      line-height: 1.06666em;
      text-align: left;
    `,
    display3: css`
      font-size: 3.5125rem;
      line-height: 1.06666em;
      text-align: left;
    `,
    headline: css`
      font-size: 1.5rem;
      line-height: 1.35416em;
      text-align: left;
    `,
    subheading: css`
      font-size: 1rem;
      line-height: 1.7em;
      text-align: left;
    `,
  },
  breakpoints: {
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px',
  },
  constants: {
    content: {
      width: '90%',
      maxWidth: '42em',
    },
  },
  Box: (props: Props) => css`
    box-sizing: border-box;
    ${props.theme.fonts.axiformaRegular};
    ${props.theme.fontStyles.body1};
  `,
};
