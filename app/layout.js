import './globals.css';

export const metadata = {
  title: 'THE FABLE TERMINAL — an electric storybook',
  description:
    "Fables from the machine. Written, illustrated, and deployed on-chain by an AI. $FABLE on Robinhood Chain.",
  icons: { icon: 'fable-logo.png' },
  openGraph: {
    title: 'THE FABLE TERMINAL',
    description: 'an electric storybook · fables from the machine · $FABLE',
    images: ['fable-logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
