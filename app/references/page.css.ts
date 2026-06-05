import { style } from '@vanilla-extract/css';

export const pageWrapper = style({
  minHeight: '100vh',
  backgroundColor: '#f8f9fc',
  display: 'flex',
  flexDirection: 'column',
});

export const main = style({
  flex: 1,
  maxWidth: 900,
  width: '100%',
  margin: '0 auto',
  padding: '40px 32px',
});

export const heading = style({
  fontSize: 28,
  fontWeight: 400,
  color: '#001d36',
  letterSpacing: '-0.01em',
  marginBottom: 8,
});

export const lead = style({
  fontSize: 14,
  color: '#43474e',
  marginBottom: 40,
});

export const section = style({
  marginBottom: 40,
});

export const sectionTitle = style({
  fontSize: 13,
  fontWeight: 600,
  color: '#73777f',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #dde2ec',
});

export const entryCard = style({
  backgroundColor: '#fff',
  border: '1px solid #dde2ec',
  borderRadius: 12,
  padding: '18px 20px',
  marginBottom: 12,
});

export const entryRef = style({
  fontSize: 14,
  color: '#1a1c1e',
  lineHeight: 1.6,
  marginBottom: 8,
});

export const entryMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
});

export const badge = style({
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 50,
  backgroundColor: '#d1e4ff',
  color: '#001d36',
  letterSpacing: '0.02em',
});

export const doiLink = style({
  fontSize: 12,
  color: '#0061a4',
  textDecoration: 'none',
  ':hover': { textDecoration: 'underline' },
});

export const notes = style({
  fontSize: 12,
  color: '#73777f',
  marginTop: 8,
  fontStyle: 'italic',
});

export const backLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
  color: '#0061a4',
  textDecoration: 'none',
  marginBottom: 32,
  ':hover': { textDecoration: 'underline' },
});
