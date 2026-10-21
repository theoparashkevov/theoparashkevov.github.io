import type { IconName } from '../Icon.astro';

export type LocalIconName =
  | 'database'
  | 'chart'
  | 'layers'
  | 'message'
  | 'puzzle'
  | 'search'
  | 'eye'
  | 'cloud'
  | 'git-branch'
  | 'terminal'
  | 'globe'
  | 'box'
  | 'cpu'
  | 'languages'
  | 'award'
  | 'shield'
  | 'smile';

export type AboutIconName = IconName | LocalIconName;

export interface SectionLink {
  id: string;
  label: string;
}

export const SECTIONS: SectionLink[] = [
  { id: 'skills', label: 'Skills' },
  { id: 'stack', label: 'Tech stack' },
  { id: 'journey', label: 'Journey' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'background', label: 'Background' },
  { id: 'whats-next', label: "What's next" },
];

export interface Skill {
  title: string;
  icon: AboutIconName;
  description: string;
}

export const HARD_SKILLS: Skill[] = [
  {
    title: 'Machine Learning',
    icon: 'sparkles',
    description:
      'Developing and deploying machine learning models for natural language processing, computer vision and predictive analytics.',
  },
  {
    title: 'Software Engineering',
    icon: 'code',
    description:
      'Designing and building scalable, robust and efficient software, with a focus on performance optimization and maintainable code.',
  },
  {
    title: 'Object-oriented Programming',
    icon: 'layers',
    description:
      'Industry-standard OOP: design patterns, clean code and clean architecture. I have built and maintained both small and large-scale applications.',
  },
  {
    title: 'Database Design',
    icon: 'database',
    description:
      'Designing and managing relational databases such as PostgreSQL and MySQL as a reliable foundation for data-driven applications.',
  },
  {
    title: 'Data Analysis',
    icon: 'chart',
    description:
      'Data preprocessing, exploratory data analysis and statistical modeling that enable insightful, data-driven decisions.',
  },
];

export const SOFT_SKILLS: Skill[] = [
  {
    title: 'Communication',
    icon: 'message',
    description:
      'Clear communication with developers, data scientists and stakeholders, which is vital for delivering solutions that meet and exceed expectations.',
  },
  {
    title: 'Teamwork & Leadership',
    icon: 'users',
    description: 'A team player who enjoys collaborating and works effectively as part of a team.',
  },
  {
    title: 'Problem-solving',
    icon: 'puzzle',
    description:
      'Solving complex problems and turning them into innovative solutions built on machine learning algorithms.',
  },
  {
    title: 'Attention to detail',
    icon: 'search',
    description:
      'A keen eye for the specifics and intricacies that make software systems robust, scalable, accurate and performant.',
  },
  {
    title: 'Continuous learning',
    icon: 'graduation-cap',
    description:
      'Staying current with machine learning and AI through hackathons, conferences, meetups and open-source projects.',
  },
];

export const LANGUAGES_AND_FRAMEWORKS = [
  'Python',
  'Java',
  'C++',
  'SQL',
  'TensorFlow',
  'PyTorch',
  'Scikit-learn',
];

export interface Tech {
  name: string;
  description: string;
  icon: string;
}

export interface TechGroup {
  title: string;
  icon: AboutIconName;
  summary: string;
  items: Tech[];
}

const DEVICON_RAW = 'https://raw.githubusercontent.com/devicons/devicon/master/icons';
const DEVICON_CDN = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

export const TECH_GROUPS: TechGroup[] = [
  {
    title: 'Data Science & Machine Learning',
    icon: 'chart',
    summary:
      'Python with NumPy for numerical work, Pandas for data manipulation and scikit-learn for machine learning: a streamlined workflow to preprocess and explore data, then train and evaluate predictive models.',
    items: [
      {
        name: 'Python',
        description: 'Programming',
        icon: `${DEVICON_RAW}/python/python-original.svg`,
      },
      {
        name: 'Pandas',
        description: 'Data science framework',
        icon: `${DEVICON_CDN}/pandas/pandas-original-wordmark.svg`,
      },
      {
        name: 'NumPy',
        description: 'Data science framework',
        icon: `${DEVICON_CDN}/numpy/numpy-original.svg`,
      },
      {
        name: 'Scikit-learn',
        description: 'ML framework',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Scikit_learn_logo_small.svg',
      },
    ],
  },
  {
    title: 'Web Development',
    icon: 'globe',
    summary:
      'Django on the backend with HTML5 and CSS3 on the front end, complemented by Selenium for automated testing and web scraping.',
    items: [
      {
        name: 'Django',
        description: 'Python web framework',
        icon: `${DEVICON_CDN}/django/django-plain.svg`,
      },
      {
        name: 'Selenium',
        description: 'Web scraping & testing',
        icon: `${DEVICON_CDN}/selenium/selenium-original.svg`,
      },
      {
        name: 'HTML5',
        description: 'Markup language',
        icon: `${DEVICON_CDN}/html5/html5-original-wordmark.svg`,
      },
      {
        name: 'CSS3',
        description: 'Styling language',
        icon: `${DEVICON_CDN}/css3/css3-original-wordmark.svg`,
      },
    ],
  },
  {
    title: 'Object-oriented & Functional Programming',
    icon: 'cpu',
    summary:
      'C and C++ for object-oriented design combined with functional programming principles: low-level efficiency with modern paradigms for flexible, performant software.',
    items: [
      { name: 'C', description: 'Programming', icon: `${DEVICON_RAW}/c/c-original.svg` },
      {
        name: 'C++',
        description: 'Programming',
        icon: `${DEVICON_RAW}/cplusplus/cplusplus-original.svg`,
      },
    ],
  },
  {
    title: 'Version Control',
    icon: 'git-branch',
    summary:
      'Git for efficient branching and version tracking, and GitHub for collaborative workflows, code reviews, project management and CI/CD.',
    items: [
      {
        name: 'Git',
        description: 'Version control',
        icon: 'https://www.vectorlogo.zone/logos/git-scm/git-scm-icon.svg',
      },
      {
        name: 'GitHub',
        description: 'Version control & CI/CD',
        icon: `${DEVICON_CDN}/github/github-original-wordmark.svg`,
      },
    ],
  },
  {
    title: 'Database Design & Management',
    icon: 'database',
    summary:
      'Relational databases such as PostgreSQL and MySQL: scalable, efficient storage and retrieval that gives data-driven applications a reliable foundation.',
    items: [
      {
        name: 'PostgreSQL',
        description: 'Database management system',
        icon: `${DEVICON_RAW}/postgresql/postgresql-original-wordmark.svg`,
      },
      {
        name: 'MySQL',
        description: 'Database management system',
        icon: `${DEVICON_RAW}/mysql/mysql-original-wordmark.svg`,
      },
    ],
  },
  {
    title: 'Cloud',
    icon: 'cloud',
    summary:
      'Amazon Web Services for compute, storage, databases, machine learning and more, to build, deploy and scale applications in the cloud.',
    items: [
      {
        name: 'AWS',
        description: 'Cloud platform',
        icon: `${DEVICON_RAW}/amazonwebservices/amazonwebservices-original-wordmark.svg`,
      },
    ],
  },
  {
    title: 'Virtualization & Hypervisors',
    icon: 'box',
    summary:
      'Docker for lightweight containers, VirtualBox for desktop virtual machines and QEMU for flexible full-system emulation.',
    items: [
      {
        name: 'Docker',
        description: 'Containerization',
        icon: `${DEVICON_RAW}/docker/docker-original-wordmark.svg`,
      },
      {
        name: 'QEMU',
        description: 'Emulator & hypervisor',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Qemu_logo.svg',
      },
      {
        name: 'VirtualBox',
        description: 'Hypervisor',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Virtualbox_logo.png',
      },
    ],
  },
  {
    title: 'System Administration & Networking',
    icon: 'terminal',
    summary:
      'Linux, with Debian as a stable distribution and Bash for automation, plus CMake and GCC for building and compiling, and SSH for remote access.',
    items: [
      {
        name: 'Linux',
        description: 'Operating system',
        icon: `${DEVICON_CDN}/linux/linux-original.svg`,
      },
      {
        name: 'Debian',
        description: 'Linux distribution',
        icon: `${DEVICON_CDN}/debian/debian-original-wordmark.svg`,
      },
      {
        name: 'Bash',
        description: 'Shell scripting',
        icon: `${DEVICON_CDN}/bash/bash-original.svg`,
      },
      {
        name: 'CMake',
        description: 'Build system',
        icon: `${DEVICON_CDN}/cmake/cmake-original.svg`,
      },
      { name: 'GCC', description: 'Compiler', icon: `${DEVICON_CDN}/gcc/gcc-original.svg` },
      {
        name: 'SSH',
        description: 'Remote access',
        icon: `${DEVICON_CDN}/ssh/ssh-original-wordmark.svg`,
      },
    ],
  },
];

export interface JourneyStep {
  kind: 'education' | 'experience';
  label: string;
  title: string;
  place: string;
  image?: { src: string; alt: string };
  icon: AboutIconName;
  body: string[];
  highlights?: string[];
}

export const JOURNEY: JourneyStep[] = [
  {
    kind: 'education',
    label: 'High school',
    title: 'German Language School',
    place: 'Ruse, Bulgaria',
    image: {
      src: '/assets/img/deutsche-schule-ruse.jpg',
      alt: 'Emblem of the Friedrich Schiller German Language School in Ruse',
    },
    icon: 'graduation-cap',
    body: [
      'An educational path shaped by languages and a commitment to academic excellence. I graduated at the top of my class with honors.',
      'Alongside my studies I earned the German language diploma DSD II and a Cambridge English certificate, both at C1 level.',
    ],
    highlights: ['Top of class, with honors', 'DSD II · C1', 'Cambridge · C1'],
  },
  {
    kind: 'education',
    label: 'University · 1 year',
    title: 'Chinese Language Program',
    place: 'Southeast University · Nanjing, China',
    image: { src: '/assets/img/SEU.jpg', alt: 'Southeast University emblem' },
    icon: 'languages',
    body: [
      'I continued my studies in a new culture at Southeast University in Nanjing. Undaunted by the language barrier, I completed a rigorous one-year Chinese language program and quickly reached the proficiency needed for a degree taught in Chinese.',
    ],
    highlights: ['Intensive one-year program'],
  },
  {
    kind: 'education',
    label: 'University · 4 years',
    title: "Bachelor's in Computer Science and Engineering",
    place: 'Southeast University · Nanjing, China',
    image: { src: '/assets/img/SEU.jpg', alt: 'Southeast University emblem' },
    icon: 'graduation-cap',
    body: [
      'A four-year degree conducted entirely in Chinese. It sharpened my ability to adapt quickly to unfamiliar environments, grasp complex concepts and navigate diverse academic settings.',
    ],
    highlights: ['Taught entirely in Chinese'],
  },
  {
    kind: 'experience',
    label: 'Industry',
    title: 'Senior Python Developer & Machine Learning Engineer',
    place: 'Software & machine learning engineering',
    icon: 'briefcase',
    body: [
      'Building robust, scalable software systems that use machine learning to deliver performance and accuracy: data pipelines, training and evaluating models, and designing and implementing complex algorithms.',
    ],
    highlights: ['Python', 'Machine learning', 'Scalable systems'],
  },
];

export interface CertificationCourse {
  title: string;
  href: string;
}

export interface Certification {
  title: string;
  issuer?: string;
  href?: string;
  courses?: CertificationCourse[];
}

export interface CertificationGroup {
  title: string;
  logo?: { src: string; alt: string };
  icon: AboutIconName;
  items: Certification[];
}

export const CERTIFICATION_GROUPS: CertificationGroup[] = [
  {
    title: 'Machine Learning & AI',
    logo: { src: '/assets/img/ai.svg', alt: 'Artificial intelligence chip icon' },
    icon: 'sparkles',
    items: [
      {
        title: 'Deep Learning Specialization',
        issuer: 'DeepLearning.AI',
        href: 'https://www.coursera.org/account/accomplishments/specialization/certificate/MACTRCAXVALX',
        courses: [
          {
            title: 'Neural Networks and Deep Learning',
            href: 'https://www.coursera.org/account/accomplishments/verify/FD8HY2KD3T55?utm_source=link',
          },
          {
            title:
              'Improving Deep Neural Networks: Hyperparameter Tuning, Regularization and Optimization',
            href: 'https://www.coursera.org/account/accomplishments/verify/C4M3ZQ33PMTK',
          },
          {
            title: 'Structuring Machine Learning Projects',
            href: 'https://www.coursera.org/account/accomplishments/certificate/6BP3V33D9TFX',
          },
          {
            title: 'Convolutional Neural Networks',
            href: 'https://www.coursera.org/account/accomplishments/certificate/3AEMV7WBXUUT',
          },
          {
            title: 'Sequence Models',
            href: 'https://www.coursera.org/account/accomplishments/certificate/ZNAKAYUTN3Z3',
          },
        ],
      },
      {
        title: 'Machine Learning',
        issuer: 'Stanford',
        href: 'https://www.coursera.org/account/accomplishments/certificate/DENPFNEAEPBV',
      },
    ],
  },
  {
    title: 'Cloud',
    logo: {
      src: `${DEVICON_CDN}/amazonwebservices/amazonwebservices-plain-wordmark.svg`,
      alt: 'Amazon Web Services logo',
    },
    icon: 'cloud',
    items: [
      {
        title: 'AWS Cloud Fundamentals Specialization',
        issuer: 'Amazon',
        href: 'https://www.coursera.org/account/accomplishments/specialization/certificate/BW8ZJKANHPH5',
        courses: [
          {
            title: 'AWS Cloud Technical Essentials',
            href: 'https://www.coursera.org/account/accomplishments/certificate/42KDWYQFQ9SK',
          },
          {
            title: 'AWS Cloud Addressing Security Risk',
            href: 'https://www.coursera.org/account/accomplishments/certificate/UN9M2TQRBBJV',
          },
          {
            title: 'AWS Cloud Building Serverless Applications',
            href: 'https://www.coursera.org/account/accomplishments/certificate/HPG7K3KRS52T',
          },
          {
            title: 'AWS Cloud Migrating to the AWS Cloud',
            href: 'https://www.coursera.org/account/accomplishments/certificate/4L4WXEKJA8GE',
          },
        ],
      },
    ],
  },
  {
    title: 'Languages',
    icon: 'languages',
    items: [
      { title: 'Cambridge Certificate in Advanced English', issuer: 'Level C1' },
      { title: 'Deutsches Sprachdiplom II (DSD)', issuer: 'Level C1' },
      { title: 'Hanyu Shuiping Kaoshi (HSK)', issuer: 'Level 4' },
    ],
  },
];

export interface Domain {
  title: string;
  context: string;
  icon: AboutIconName;
}

export const DOMAINS: Domain[] = [
  { title: 'Computer vision', context: 'Algorithms for autonomous vehicles', icon: 'eye' },
  { title: 'Natural language processing', context: 'Models for chatbots', icon: 'message' },
  { title: 'Recommendation systems', context: 'For e-commerce platforms', icon: 'sparkles' },
  { title: 'Fraud detection', context: 'Systems for financial institutions', icon: 'shield' },
  { title: 'Sentiment analysis', context: 'Models for social media platforms', icon: 'smile' },
];

export const PRINCIPLES = [
  { title: 'Technical excellence', icon: 'award' },
  { title: 'Collaboration', icon: 'users' },
  { title: 'Customer-centric approach', icon: 'briefcase' },
] as const satisfies readonly { title: string; icon: AboutIconName }[];
