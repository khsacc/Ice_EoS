import { style, styleVariants } from '@vanilla-extract/css';

export const sidebar = style({
  width: 240,
  minHeight: '100vh',
  backgroundColor: '#f3f4f8',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
});

export const sidebarHeader = style({
  padding: '24px 16px 12px',
});

export const sidebarTitle = style({
  fontSize: 11,
  fontWeight: 500,
  color: '#73777f',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  margin: 0,
});

export const nav = style({
  flex: 1,
  padding: '4px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const sectionHeader = style({
  fontSize: 11,
  fontWeight: 500,
  color: '#73777f',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  padding: '12px 16px 4px',
});

export const sectionDivider = style({
  height: 1,
  margin: '8px 16px',
  backgroundColor: '#c3c7cf',
  opacity: 0.5,
});

const navItemBase = style({
  width: '100%',
  textAlign: 'left',
  padding: '12px 16px',
  borderRadius: 50,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'background-color 0.2s ease, color 0.2s ease',
  letterSpacing: '0.01em',
});

export const navItem = styleVariants({
  default: [navItemBase, {
    backgroundColor: 'transparent',
    color: '#43474e',
    ':hover': { backgroundColor: 'rgba(0, 97, 164, 0.08)' },
  }],
  active: [navItemBase, {
    backgroundColor: '#d1e4ff',
    color: '#001d36',
    fontWeight: 600,
  }],
});
