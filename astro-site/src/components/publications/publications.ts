export interface Publication {
  title: string;
  authors: string;
  venue: string;
  year: number;
  abstract: string;
  featured?: boolean;
  links: {
    label: string;
    href: string;
  }[];
  /** Path to a locally hosted PDF, shown in the embedded viewer. */
  pdf?: string;
}

export const PUBLICATIONS: Publication[] = [
  {
    title:
      'Engineering Origami: A Comprehensive Review of Recent Applications, Design Methods, and Tools',
    authors:
      'Marco Meloni, Jianguo Cai, Qian Zhang, Daniel Sang-Hoon Lee, Meng Li, Ruijun Ma, Teo Emilov Parashkevov, Jian Feng',
    venue: 'Advanced Science',
    year: 2021,
    featured: true,
    abstract:
      'A cross-disciplinary review of origami-based engineering: applications from the nano to the meter scale across biomedical engineering, architecture, robotics, space structures, biomimetic engineering, fold-cores and metamaterials, together with the design methods, tools and manufacturing constraints that govern them, and the open questions that remain.',
    links: [
      {
        label: 'ResearchGate',
        href: 'https://www.researchgate.net/publication/351579607_Engineering_Origami_A_Comprehensive_Review_of_Recent_Applications_Design_Methods_and_Tools',
      },
    ],
    pdf: '/papers/engineering-origami-review.pdf',
  },
];
