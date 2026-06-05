import { style, styleVariants } from '@vanilla-extract/css';

export const tabContent = style({ display: 'flex', flexDirection: 'column', gap: 20 });

export const inputGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
});

export const fieldWrapper = style({ display: 'flex', flexDirection: 'column', gap: 4 });

export const fieldHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const fieldLabel = style({
  fontSize: 12,
  fontWeight: 500,
  color: '#43474e',
  letterSpacing: '0.04em',
});

export const input = style({
  width: '100%',
  padding: '13px 15px',
  border: '1px solid #73777f',
  borderRadius: 4,
  fontSize: 16,
  color: '#1a1c1e',
  backgroundColor: 'transparent',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, border-width 0.1s',
  ':focus': {
    outline: 'none',
    borderWidth: 2,
    borderColor: '#0061a4',
    padding: '12px 14px',
  },
  ':hover': {
    borderColor: '#1a1c1e',
  },
  ':disabled': {
    backgroundColor: '#f1f3f9',
    borderColor: '#c1c4cc',
    color: '#73777f',
    cursor: 'not-allowed',
  },
  '::placeholder': { color: '#73777f' },
});

export const calcButton = style({
  alignSelf: 'flex-start',
  padding: '10px 24px',
  backgroundColor: '#0061a4',
  color: '#ffffff',
  border: 'none',
  borderRadius: 50,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  letterSpacing: '0.01em',
  boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)',
  transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
  ':hover': {
    backgroundColor: '#004f8c',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)',
  },
  ':active': {
    backgroundColor: '#003e70',
    boxShadow: 'none',
  },
});

export const messageBox = styleVariants({
  error: {
    padding: '14px 16px',
    backgroundColor: '#ffdad6',
    borderRadius: 8,
    fontSize: 14,
    color: '#410002',
    borderLeft: '4px solid #ba1a1a',
  },
  result: {
    padding: '18px 20px',
    backgroundColor: '#d1e4ff',
    borderRadius: 8,
    borderLeft: '4px solid #0061a4',
  },
});

export const resultTitle = style({
  fontSize: 11,
  fontWeight: 600,
  color: '#0061a4',
  marginBottom: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
});

export const resultRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  fontSize: 14,
  color: '#1a1c1e',
  marginBottom: 6,
});

export const resultRowLast = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  fontSize: 14,
  color: '#1a1c1e',
});

export const resultValue = style({
  fontFamily: 'var(--font-geist-mono, monospace)',
  fontWeight: 600,
  fontSize: 15,
  color: '#001d36',
});

export const paramsBox = style({
  padding: '14px 16px',
  backgroundColor: '#dfe2eb',
  borderRadius: 8,
  fontSize: 12,
  color: '#43474e',
  lineHeight: 1.7,
});

export const noteText = style({
  fontSize: 12,
  color: '#73777f',
  fontStyle: 'italic',
});

export const footerNote = style({
  fontSize: 11,
  color: '#73777f',
  lineHeight: 1.6,
});

export const noDataText = style({
  fontSize: 14,
  color: '#73777f',
  textAlign: 'center',
  padding: '32px 0',
});

export const loadingText = style({
  fontSize: 13,
  color: '#0061a4',
  fontStyle: 'italic',
  padding: '10px 0',
});

// Unit toggle (K / °C)
export const unitToggleGroup = style({
  display: 'flex',
  gap: 2,
  padding: 2,
  borderRadius: 50,
  backgroundColor: '#dfe2eb',
});

const unitToggleBtnBase = style({
  padding: '3px 10px',
  fontSize: 11,
  fontWeight: 500,
  border: 'none',
  borderRadius: 50,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease, color 0.15s ease',
  letterSpacing: '0.01em',
});

export const unitToggleBtn = styleVariants({
  inactive: [unitToggleBtnBase, {
    backgroundColor: 'transparent',
    color: '#43474e',
    ':hover': { backgroundColor: 'rgba(0,97,164,0.1)' },
  }],
  active: [unitToggleBtnBase, {
    backgroundColor: '#0061a4',
    color: '#ffffff',
  }],
});

export const unitSelect = style({
  padding: '3px 10px',
  border: 'none',
  borderRadius: 50,
  fontSize: 11,
  fontWeight: 500,
  color: '#0061a4',
  backgroundColor: '#d1e4ff',
  cursor: 'pointer',
  ':focus': { outline: 'none' },
});
