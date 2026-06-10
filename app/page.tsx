import type { Metadata } from 'next';
import App from './components/App';

export const metadata: Metadata = {
  title: { absolute: 'Water Ice EoS Dictionary' },
  description:
    'Interactive calculator for equations of state of water ice polymorphs (Ih, II, III, V, VI, VII, VIII, X) for H₂O and D₂O. Covers BM3, Vinet, AP1, and SeaFreeze EoS from literature.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Water Ice EoS Dictionary',
    description:
      'Interactive calculator for equations of state of water ice polymorphs (Ih, II, III, V, VI, VII, VIII, X) for H₂O and D₂O.',
    url: '/',
  },
  twitter: {
    title: 'Water Ice EoS Dictionary',
    description:
      'Interactive calculator for equations of state of water ice polymorphs (Ih, II, III, V, VI, VII, VIII, X) for H₂O and D₂O.',
  },
};

export default function Home() {
  return <App />;
}
