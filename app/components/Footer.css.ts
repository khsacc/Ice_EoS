import { style } from '@vanilla-extract/css';

export const footer = style({
  borderTop: '1px solid #dde2ec',
  backgroundColor: '#fdfbff',
  padding: '20px 32px',
});

export const inner = style({
  maxWidth: 1400,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
});

export const left = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const credit = style({
  fontSize: 12,
  color: '#73777f',
});

export const contact = style({
  fontSize: 12,
  color: '#73777f',
});

export const license = style({
  fontSize: 11,
  color: '#9ea4ae',
});

export const contactLink = style({
  color: '#0061a4',
  textDecoration: 'none',
  ':hover': { textDecoration: 'underline' },
});

export const nav = style({
  display: 'flex',
  gap: 20,
  alignItems: 'center',
});

export const navLink = style({
  fontSize: 13,
  color: '#0061a4',
  textDecoration: 'none',
  ':hover': { textDecoration: 'underline' },
});
