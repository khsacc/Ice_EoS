import { style } from '@vanilla-extract/css';

export const wrapper = style({ display: 'flex', flexDirection: 'column', gap: 4 });

export const label = style({
  fontSize: 12,
  fontWeight: 500,
  color: '#43474e',
  letterSpacing: '0.04em',
});

export const select = style({
  width: '100%',
  padding: '13px 15px',
  border: '1px solid #73777f',
  borderRadius: 4,
  fontSize: 14,
  color: '#1a1c1e',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease',
  ':focus': {
    outline: 'none',
    borderWidth: 2,
    borderColor: '#0061a4',
    padding: '12px 14px',
  },
  ':hover': {
    borderColor: '#1a1c1e',
  },
});

export const fullRef = style({
  fontSize: 12,
  color: '#73777f',
  lineHeight: 1.55,
});

export const doiLink = style({
  display: 'inline-block',
  marginTop: 2,
  fontSize: 12,
  color: '#0061a4',
  textDecoration: 'none',
  ':hover': {
    textDecoration: 'underline',
  },
});
