export const SITE_URL = 'https://theoparashkevov.github.io';
export const SITE_TITLE = 'Teo Parashkevov';
export const SITE_TAGLINE = 'Machine Learning Engineer & Senior Python Developer';
export const SITE_DESCRIPTION =
  'Personal blog and portfolio of Teo Parashkevov, Machine Learning Engineer and Senior Python Developer, writing about scalable systems, AI, and software engineering.';
export const AUTHOR = {
  name: 'Teo Parashkevov',
  email: 'theo.parashkevov@gmail.com',
  avatar: '/assets/img/Teo-Parashkevov-Home.jpg',
};

// Expertise statements emitted as schema.org `knowsAbout` / `hasOccupation` on
// every page's Person structured data, so search and AI engines can attribute
// clear, factual skills (and lift them into answers) without guessing from prose.
export const AUTHOR_KNOWS_ABOUT = [
  'Machine learning engineering',
  'Large language models (LLMs)',
  'Retrieval-augmented generation (RAG)',
  'AI agents and function calling',
  'Natural language processing (NLP)',
  'Python',
  'Django',
  'FastAPI',
  'SQL and PostgreSQL',
  'Microsoft .NET / C#',
  'TypeScript',
  'Linux system administration',
  'Networking and VPN infrastructure (OpenVPN, WireGuard, nftables)',
  'DevOps and CI/CD',
  'Kubernetes',
  'Docker',
  'Data science with NumPy, Pandas, scikit-learn',
];

export const AUTHOR_OCCUPATION = {
  title: 'Machine Learning Engineer & Senior Python Developer',
  description:
    'Senior software engineer and machine learning engineer building production AI/ML systems, scalable Python backends and data platforms. Former Software Engineer Intern at Microsoft (Shanghai); currently Senior Software Engineer (AI/ML) at B EYE (Sofia).',
};

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/blog/', label: 'Blog' },
  { href: '/projects/', label: 'Projects' },
  { href: '/open-source/', label: 'Open Source' },
  { href: '/publications/', label: 'Publications' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/theoparashkevov', icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/teo-parashkevov/', icon: 'linkedin' },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/channel/UCe0mtJP7Pl7JmLG8kDQma-g',
    icon: 'youtube',
  },
  { label: 'Email', href: 'mailto:theo.parashkevov@gmail.com', icon: 'mail' },
  { label: 'RSS', href: '/rss.xml', icon: 'rss' },
] as const;
