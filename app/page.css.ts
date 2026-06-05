import { style } from '@vanilla-extract/css';

export const appWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: '#f8f9fc',
});

export const layout = style({
  display: 'flex',
  flex: 1,
});

export const main = style({
  flex: 1,
  padding: '40px 32px',
  overflowY: 'auto',
});
