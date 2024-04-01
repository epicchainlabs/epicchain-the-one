import { css, Global } from '@emotion/core';
import * as React from 'react';

// prettier-ignore
export const GlobalFonts = () => (
  <Global
    styles={css`
      @font-face {
        font-family: 'Axiforma-Bold';
        src: url('https://neo-one.io/static/fonts/Axiforma-Bold.woff2') format('woff2'), url('https://neo-one.io/static/fonts/Axiforma-Bold.woff') format('woff');
        font-weight: 700;
        font-style: normal;
      }

      @font-face {
        font-family: 'Axiforma-SemiBold';
        src: url('https://neo-one.io/static/fonts/Axiforma-SemiBold.woff2') format('woff2'), url('https://neo-one.io/static/fonts/Axiforma-SemiBold.woff') format('woff');
        font-weight: 600;
        font-style: normal;
      }

      @font-face {
        font-family: 'Axiforma-Medium';
        src: url('https://neo-one.io/static/fonts/Axiforma-Medium.woff2') format('woff2'), url('https://neo-one.io/static/fonts/Axiforma-Medium.woff') format('woff');
        font-weight: 500;
        font-style: normal;
      }

      @font-face {
        font-family: 'Axiforma-Regular';
        src: url('https://neo-one.io/static/fonts/Axiforma-Regular.woff2') format('woff2'), url('https://neo-one.io/static/fonts/Axiforma-Regular.woff') format('woff');
        font-weight: 400;
        font-style: normal;
      }

      @font-face {
        font-family: 'Axiforma-Book';
        src: url('https://neo-one.io/static/fonts/Axiforma-Book.woff2') format('woff2'), url('https://neo-one.io/static/fonts/Axiforma-Book.woff') format('woff');
        font-weight: 200;
        font-style: normal;
      }

      @font-face {
        font-family: 'Axiforma-Thin';
        src: url('https://neo-one.io/static/fonts/Axiforma-Thin.woff2') format('woff2'), url('https://neo-one.io/static/fonts/Axiforma-Thin.woff') format('woff');
        font-weight: 400;
        font-style: normal;
      }
    `}
  />
);
