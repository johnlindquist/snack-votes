import VotePage from './vote/page';

// Disable static optimization for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  return <VotePage />;
}
