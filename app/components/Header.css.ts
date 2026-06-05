import { style } from '@vanilla-extract/css';

export const header = style({
  backgroundColor: '#fdfbff',
  boxShadow: '0 1px 2px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)',
  position: 'sticky',
  top: 0,
  zIndex: 10,
});

export const inner = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 32px',
  gap: 16,
});

export const titleBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const titleRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 16,
  margin: 0,
});

export const title = style({
  fontSize: 24,
  fontWeight: 400,
  color: '#001d36',
  letterSpacing: '-0.01em',
});

export const titleRefLink = style({
  fontSize: 16,
  fontWeight: 500,
  color: '#0061a4',
  textDecoration: 'none',
  letterSpacing: '0',
  ':hover': { textDecoration: 'underline' },
});

export const subtitle = style({
  fontSize: 13,
  color: '#43474e',
  margin: 0,
  letterSpacing: '0.01em',
});

export const contact = style({
  fontSize: 12,
  color: '#73777f',
  margin: 0,
  letterSpacing: '0.01em',
});

export const emailLink = style({
  color: '#0061a4',
  textDecoration: 'none',
  ':hover': { textDecoration: 'underline' },
});

export const githubBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 18px',
  border: '1px solid #73777f',
  borderRadius: 50,
  fontSize: 14,
  fontWeight: 500,
  color: '#1a1c1e',
  textDecoration: 'none',
  backgroundColor: 'transparent',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  ':hover': {
    backgroundColor: 'rgba(0,97,164,0.08)',
    borderColor: '#0061a4',
    color: '#0061a4',
  },
});
