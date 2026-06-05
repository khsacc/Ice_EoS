import { style, styleVariants } from '@vanilla-extract/css';

export const container = style({
  maxWidth: 680,
  margin: '0 auto',
  backgroundColor: '#fdfbff',
  borderRadius: 16,
  padding: '28px 32px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)',
});

export const heading = style({
  fontSize: 22,
  fontWeight: 400,
  color: '#1a1c1e',
  marginBottom: 24,
  letterSpacing: '0.01em',
});

export const tabBar = style({
  display: 'flex',
  borderBottom: '1px solid #c3c7cf',
  marginBottom: 24,
  gap: 0,
});

const tabBtnBase = style({
  flex: 1,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 500,
  border: 'none',
  borderBottom: '2px solid transparent',
  background: 'none',
  cursor: 'pointer',
  transition: 'color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
  marginBottom: -1,
  borderRadius: '4px 4px 0 0',
  letterSpacing: '0.01em',
});

export const tabBtn = styleVariants({
  inactive: [tabBtnBase, {
    color: '#73777f',
    ':hover': { backgroundColor: 'rgba(0, 97, 164, 0.08)', color: '#43474e' },
  }],
  active: [tabBtnBase, {
    color: '#0061a4',
    borderBottomColor: '#0061a4',
    fontWeight: 600,
  }],
  disabled: [tabBtnBase, {
    color: '#c1c4cc',
    cursor: 'not-allowed',
  }],
});
