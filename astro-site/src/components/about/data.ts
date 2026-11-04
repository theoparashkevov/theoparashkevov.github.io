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
    title: 'Generative AI & LLMs',
    icon: 'sparkles',
    summary:
      'Large language model applications: LLM APIs, agent frameworks and local models for retrieval-augmented generation over vector databases such as pgvector, function calling and structured output.',
    items: [
      {
        name: 'OpenAI',
        description: 'LLM API',
        icon: '/assets/img/tech/openai.png',
      },
      {
        name: 'LangChain',
        description: 'Agent & LLM framework',
        icon: 'https://cdn.simpleicons.org/langchain',
      },
      {
        name: 'Ollama',
        description: 'Local LLM runtime',
        icon: `${DEVICON_CDN}/ollama/ollama-original.svg`,
      },
      {
        name: 'Hugging Face',
        description: 'Transformers & models',
        icon: 'https://cdn.simpleicons.org/huggingface',
      },
    ],
  },
  {
    title: 'Machine Learning & Forecasting',
    icon: 'chart',
    summary:
      'Deep learning and gradient-boosted models for prediction and forecasting, plus MLOps tooling to track experiments and serve models reliably in production.',
    items: [
      {
        name: 'PyTorch',
        description: 'Deep learning framework',
        icon: `${DEVICON_CDN}/pytorch/pytorch-original.svg`,
      },
      {
        name: 'TensorFlow',
        description: 'Deep learning framework',
        icon: `${DEVICON_CDN}/tensorflow/tensorflow-original.svg`,
      },
      {
        name: 'XGBoost',
        description: 'Gradient boosting',
        icon: '/assets/img/tech/xgboost.png',
      },
      {
        name: 'MLflow',
        description: 'MLOps & experiment tracking',
        icon: 'https://cdn.simpleicons.org/mlflow',
      },
      {
        name: 'Whisper ASR',
        description: 'faster-whisper · VAD · diarization',
        icon: '/assets/img/tech/whisper.png',
      },
    ],
  },
  {
    title: 'APIs & Backend',
    icon: 'layers',
    summary:
      'Service-to-service and user-facing APIs: REST and WebSocket/SSE endpoints, high-performance Python APIs and strongly typed RPC for integrating analytics platforms with backend services.',
    items: [
      {
        name: 'FastAPI',
        description: 'Python API framework',
        icon: `${DEVICON_CDN}/fastapi/fastapi-original.svg`,
      },
      {
        name: 'gRPC',
        description: 'RPC framework',
        icon: 'https://www.vectorlogo.zone/logos/grpcio/grpcio-icon.svg',
      },
      {
        name: 'Socket.IO',
        description: 'WebSockets & realtime',
        icon: `${DEVICON_CDN}/socketio/socketio-original.svg`,
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
      {
        name: 'TypeScript',
        description: 'Typed JavaScript',
        icon: `${DEVICON_CDN}/typescript/typescript-original.svg`,
      },
      {
        name: 'Chromium',
        description: 'Extensions · tabCapture · AudioWorklet',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg',
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
    title: 'DevOps & CI/CD',
    icon: 'git-branch',
    summary:
      'Automated pipelines and container orchestration for building, testing and deploying reliably: CI with GitHub Actions, Kubernetes for orchestration and Nginx as a reverse proxy and ingress.',
    items: [
      {
        name: 'GitHub Actions',
        description: 'CI/CD pipelines',
        icon: `${DEVICON_CDN}/githubactions/githubactions-original.svg`,
      },
      {
        name: 'Kubernetes',
        description: 'Container orchestration',
        icon: `${DEVICON_CDN}/kubernetes/kubernetes-original.svg`,
      },
      {
        name: 'Nginx',
        description: 'Reverse proxy & ingress',
        icon: `${DEVICON_CDN}/nginx/nginx-original.svg`,
      },
      {
        name: 'Forgejo',
        description: 'Git hosting & CI',
        icon: 'https://cdn.simpleicons.org/forgejo',
      },
    ],
  },
  {
    title: 'Self-hosted Infrastructure & Platforms',
    icon: 'box',
    summary:
      'The platforms I run and maintain myself: lightweight Kubernetes with k3s and containerd on Proxmox VE hypervisors, load balancing with MetalLB, service discovery with CoreDNS, secure remote access over OpenVPN, TLS via Let’s Encrypt and a private container registry with Harbor.',
    items: [
      {
        name: 'k3s',
        description: 'Lightweight Kubernetes',
        icon: '/assets/img/tech/k3s.png',
      },
      {
        name: 'containerd',
        description: 'Container runtime',
        icon: '/assets/img/tech/containerd.png',
      },
      {
        name: 'Proxmox VE',
        description: 'Virtualization platform',
        icon: '/assets/img/tech/proxmox.png',
      },
      {
        name: 'MetalLB',
        description: 'Load balancer',
        icon: '/assets/img/tech/metallb.png',
      },
      {
        name: 'CoreDNS',
        description: 'Service discovery & DNS',
        icon: '/assets/img/tech/coredns.png',
      },
      {
        name: 'OpenVPN',
        description: 'VPN & remote access',
        icon: 'https://cdn.simpleicons.org/openvpn',
      },
      {
        name: 'Let’s Encrypt',
        description: 'TLS certificates',
        icon: 'https://cdn.simpleicons.org/letsencrypt',
      },
      {
        name: 'Harbor',
        description: 'Container registry',
        icon: '/assets/img/tech/harbor.png',
      },
    ],
  },
  {
    title: 'Enterprise & Manufacturing Integrations',
    icon: 'briefcase',
    summary:
      'Integrating AI and data systems with enterprise environments: Microsoft 365 collaboration suites, identity and access management with Active Directory, and shop-floor connectivity through OPC UA, ERP and MES systems — down to production formats such as MPR, DXF and BHX.',
    items: [
      {
        name: 'Microsoft 365',
        description: 'SharePoint · Exchange · Teams',
        icon: '/assets/img/tech/microsoft365.png',
      },
      {
        name: 'Microsoft Teams',
        description: 'Collaboration & comms',
        icon: '/assets/img/tech/teams.png',
      },
      {
        name: 'Active Directory',
        description: 'Identity & access (Entra)',
        icon: `${DEVICON_CDN}/azure/azure-original.svg`,
      },
      {
        name: 'OPC UA',
        description: 'Industrial interoperability',
        icon: '/assets/img/tech/opc.png',
      },
      {
        name: 'SAP',
        description: 'ERP & MES integration',
        icon: 'https://cdn.simpleicons.org/sap',
      },
      {
        name: 'AutoCAD',
        description: 'MPR / DXF / BHX formats',
        icon: 'https://cdn.simpleicons.org/autocad',
      },
    ],
  },
  {
    title: 'Core Development & Tooling',
    icon: 'terminal',
    summary:
      'Day-to-day languages and environments beyond the ML stack: systems and CLI work in Go and the fish shell, and a keyboard-driven workflow in VS Code, often over Remote-SSH on self-hosted machines.',
    items: [
      {
        name: 'Go',
        description: 'Systems programming',
        icon: `${DEVICON_CDN}/go/go-original.svg`,
      },
      {
        name: 'fish',
        description: 'Shell scripting',
        icon: `${DEVICON_CDN}/fish/fish-original.svg`,
      },
      {
        name: 'VS Code',
        description: 'Editor · Remote-SSH',
        icon: `${DEVICON_CDN}/vscode/vscode-original.svg`,
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
      {
        name: 'Snowflake',
        description: 'Cloud data warehouse',
        icon: 'https://cdn.simpleicons.org/snowflake/29B5E8',
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
        icon: `${DEVICON_RAW}/amazonwebservices/amazonwebservices-original.svg`,
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

export interface JourneyPerson {
  name: string;
  href: string;
}

export interface JourneyStep {
  kind: 'education' | 'experience';
  label: string;
  title: string;
  place: string;
  placeHref?: string;
  image?: { src: string; alt: string } | { src: string; alt: string }[];
  icon: AboutIconName;
  body: string[];
  highlights?: string[];
  people?: JourneyPerson[];
}

export const JOURNEY: JourneyStep[] = [
  {
    kind: 'education',
    label: '2010 – 2015 · High school',
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
    label: '2015 – 2016 · University',
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
    kind: 'experience',
    label: '2019 – 2020 · Internship',
    title: 'Python Developer Intern',
    place: 'Southeast University · Nanjing, China',
    image: { src: '/assets/img/SEU.jpg', alt: 'Southeast University emblem' },
    icon: 'code',
    body: [
      'My first industry role: developing and testing Python code, troubleshooting technical issues and automating the testing of a new web application — from simulating user interactions to parsing data and generating detailed performance reports.',
    ],
    highlights: ['Python', 'Test automation', 'Data visualization'],
  },
  {
    kind: 'experience',
    label: '2019 – 2020 · Internship',
    title: 'Software Engineer Intern',
    place: 'Microsoft · Shanghai, China',
    icon: 'briefcase',
    body: [
      'I designed, built and tested real product features across Microsoft platforms and services, working in C#, Java, Python and TypeScript. I collaborated with cross-functional teams and gained hands-on experience with Azure and modern cloud engineering in a fast-paced, global environment.',
    ],
    highlights: ['C# · Java · TypeScript', 'Azure'],
  },
  {
    kind: 'education',
    label: '2016 – 2021 · University',
    title: "Bachelor's in Computer Science and Engineering",
    place: 'Southeast University · Nanjing, China',
    image: { src: '/assets/img/SEU.jpg', alt: 'Southeast University emblem' },
    icon: 'graduation-cap',
    body: [
      'A four-year degree conducted entirely in Chinese. It sharpened my ability to adapt quickly to unfamiliar environments, grasp complex concepts and navigate diverse academic settings.',
      'Alongside my degree I worked as an NLP engineer and researcher, designing and training models on data extracted from Chinese travel websites — recommendation engines, sentiment analysis and predictive analytics — using NLTK, SpaCy and Gensim.',
    ],
    highlights: ['Taught entirely in Chinese', 'NLP research'],
  },
  {
    kind: 'experience',
    label: '2020 – 2022 · 2 years',
    title: 'Python & Embedded Systems Developer',
    place: 'ClusterDesktop · Sofia, Bulgaria',
    icon: 'terminal',
    body: [
      'Server-side automation for data extraction and manipulation, embedded C development on Linux, and a facial recognition system for internal security applications. I optimized existing server applications to reduce memory and resource usage on Debian systems.',
    ],
    highlights: ['Python', 'Embedded C', 'Linux'],
  },
  {
    kind: 'experience',
    label: '2021 – 2022 · 1 year',
    title: '.NET & Python Developer · ML Engineer',
    place: 'Incess · Sofia, Bulgaria',
    icon: 'code',
    body: [
      'Desktop application development in .NET with MySQL database design and integration, Python modules for web scraping, system administration automation and two-factor authentication — plus data analysis and image processing work.',
    ],
    highlights: ['.NET', 'MySQL', 'Automation'],
  },
  {
    kind: 'experience',
    label: '2022 – 2024 · 2 years',
    title: 'Software Engineer → Senior Software Engineer (AI/ML)',
    place: 'B EYE · Sofia, Bulgaria',
    placeHref: 'https://b-eye.com/',
    image: { src: '/assets/img/companies/b-eye.png', alt: 'B EYE logo' },
    icon: 'briefcase',
    body: [
      'Platform engineering and AI/ML development: building Django backends that expose internal ML solutions and data analytics, machine learning for demand time-series prediction, and software that helps supply planners in manufacturing find optimal resource allocation during shortages and supply chain disruptions.',
    ],
    highlights: ['Python', 'Django', 'ML in production'],
  },
  {
    kind: 'experience',
    label: '2024 – Present',
    title: 'AI Solutions Manager & Software Product Development Team Lead',
    place: 'B EYE · Sofia, Bulgaria',
    placeHref: 'https://b-eye.com/',
    image: { src: '/assets/img/companies/b-eye.png', alt: 'B EYE logo' },
    icon: 'users',
    body: [
      'I lead teams of ML engineers, developers and DevOps specialists, architecting scalable AI solutions from data ingestion to deployment — traditional ML and Generative AI, LLMs, vector databases and RAG systems — while managing projects from requirements to delivery and mentoring developers through code reviews and workshops.',
    ],
    highlights: ['Team leadership', 'Generative AI', 'RAG', 'Architecture'],
  },
  {
    kind: 'experience',
    label: '2022 – 2023 · Consulting',
    title: 'AI Consultant · Supply Chain Optimization',
    place: 'Edwards Lifesciences',
    placeHref: 'https://www.edwards.com/',
    image: { src: '/assets/img/consulting/edwards.png', alt: 'Edwards Lifesciences logo' },
    icon: 'briefcase',
    body: [
      'Designed and built a material shortage optimization platform for supply planners in manufacturing: a set of Python tools with machine learning libraries for production and supply chain optimization, integrating a local Qlik Sense server with a Python framework over gRPC.',
      'The platform analyzes bill-of-materials structures under constraints such as budget, time and distance, and computes optimization strategies for chosen output variables — for example, optimizing delivery time given constraints on a specific material. Supply planners can simulate scenarios, compare allocation strategies and track KPIs such as inventory levels, supplier performance and lead times.',
    ],
    highlights: ['Python', 'gRPC', 'Qlik Sense', 'Optimization'],
    people: [
      {
        name: 'Anique Tahir',
        href: 'https://www.linkedin.com/in/anique-tahir-cdmp-cscp-30160251/',
      },
      { name: 'Zuzana Sislerova', href: 'https://www.linkedin.com/in/zuzanasislerova/' },
      { name: 'Eric Park', href: 'https://www.linkedin.com/in/eric-park-mba-cpim-44974b70/' },
      { name: 'Nathan Yun', href: 'https://www.linkedin.com/in/nathan-yun-536482b/' },
    ],
  },
  {
    kind: 'experience',
    label: '2022 – 2023 · Consulting',
    title: 'AI Consultant · Healthcare Data Platform',
    place: 'AstraZeneca · MSD',
    image: [
      { src: '/assets/img/consulting/astrazeneca.png', alt: 'AstraZeneca logo' },
      { src: '/assets/img/consulting/msd.png', alt: 'MSD logo' },
    ],
    icon: 'briefcase',
    body: [
      'Led the development of a patient survey platform supporting breast cancer patients, in partnership with a Bulgarian non-profit organization. Patients in different focus groups, organized by disease stage, complete surveys on their physical and mental status; dependent questions are connected and machine learning models produce analyses and reports for each survey campaign.',
      'The platform was built with industry-standard encryption and compliance measures to protect sensitive health information, and it was designed to integrate with existing healthcare systems and EHR databases.',
    ],
    highlights: ['Team leadership', 'ML pipelines', 'Healthcare', 'Privacy'],
  },
  {
    kind: 'experience',
    label: '2024 · Consulting',
    title: 'AI Consultant · Production Optimization',
    place: 'Valmet',
    placeHref: 'https://www.valmet.com/',
    image: { src: '/assets/img/consulting/valmet.png', alt: 'Valmet logo' },
    icon: 'briefcase',
    body: [
      'Worked embedded with an internal development team to enhance their production optimization software. The team had built an internal classification system for rolls of production-line products and materials; I helped redesign and optimize it on a Python backend, modeling the different levels of the production life cycle with clean object-oriented abstractions.',
    ],
    highlights: ['Python', 'OOP design', 'Production systems'],
    people: [
      { name: 'Joonas Pulkkinen', href: 'https://www.linkedin.com/in/joonas-pulkkinen-991703140/' },
      { name: 'Olli Luukkonen', href: 'https://www.linkedin.com/in/olli-luukkonen-2aa2442/' },
    ],
  },
  {
    kind: 'experience',
    label: '2025 – 2026 · Consulting',
    title: 'AI Consultant · Enterprise AI',
    place: 'Merck Group',
    placeHref: 'https://www.merckgroup.com/en',
    image: { src: '/assets/img/consulting/merck.png', alt: 'Merck Group logo' },
    icon: 'briefcase',
    body: [
      'Delivered two projects over the course of a year. The first was an internal Text-to-SQL solution backed by a Snowflake data warehouse: an easy-to-use visual interface where business users can ask questions in natural language and get real-time answers from live data, with a variety of AI providers integrated behind a common layer.',
      'The second was an independent development project: a knowledge capture, consolidation and management system for internal pharmaceutical research data, designed and implemented end to end for the stakeholder.',
    ],
    highlights: ['Text-to-SQL', 'Snowflake', 'LLMs', 'Knowledge management'],
    people: [
      {
        name: 'Maximilian Schön',
        href: 'https://www.linkedin.com/in/maximilian-sch%C3%B6n-457a4885/',
      },
      { name: 'Rolf Roth', href: 'https://www.linkedin.com/in/dr-rolf-roth-b7729763/' },
      { name: 'Andreas Lehmann', href: 'https://www.linkedin.com/in/andreas-lehmann-18a70aa6/' },
    ],
  },
  {
    kind: 'experience',
    label: '2026 · Consulting',
    title: 'AI Consultant · Predictive Analytics',
    place: 'Novocure',
    placeHref: 'https://www.novocure.com/',
    image: { src: '/assets/img/consulting/novocure.png', alt: 'Novocure logo' },
    icon: 'briefcase',
    body: [
      'Led the AI team in developing a machine learning forecasting algorithm for prescription behavior. Based on the available data sources, we trained and compared models — XGBoost, random forest and polynomial regression — to forecast, within a three-to-six-month horizon, whether a given healthcare professional or organization would prescribe a given medical product.',
    ],
    highlights: ['XGBoost', 'Forecasting', 'Team leadership'],
    people: [
      { name: 'Saida Ibraeva', href: 'https://www.linkedin.com/in/saida-ibraeva/' },
      { name: 'Simon Ball', href: 'https://www.linkedin.com/in/simon-ball-92a30961/' },
      { name: 'Vilmos Szabó', href: 'https://www.linkedin.com/in/vilmos-szab%C3%B3-64929b224/' },
    ],
  },
  {
    kind: 'experience',
    label: '2025 – Present',
    title: 'Chief Technology Officer',
    place: 'FluxAnalytics',
    placeHref: 'https://www.fluxanalytics.ai/',
    image: { src: '/assets/img/companies/fluxanalytics.png', alt: 'FluxAnalytics logo' },
    icon: 'cpu',
    body: [
      'Leading the technical design and architecture of Flux end to end — agent orchestration, real-time meeting intelligence and the knowledge layer — and solving the hardest engineering problems across the stack. Flux is an early-stage AI company working on context debt.',
    ],
    highlights: ['CTO', 'Agent orchestration', 'Early-stage'],
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
      src: `${DEVICON_CDN}/amazonwebservices/amazonwebservices-original.svg`,
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
