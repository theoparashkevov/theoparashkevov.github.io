import type { IconName } from '../Icon.astro';

export interface Project {
  name: string;
  description: string;
  icon: IconName;
  tags: string[];
  url?: string;
}

export const PROJECTS: Project[] = [
  {
    name: 'Manufacturing Optimization',
    description:
      'MRP/ERP optimization software based on linear programming and neural network optimization.',
    icon: 'sparkles',
    tags: ['Linear programming', 'Neural networks', 'MRP/ERP'],
  },
  {
    name: 'Referendo',
    description: 'Python-based medical healthcare web platform for data analytics using surveys.',
    icon: 'users',
    tags: ['Python', 'Healthcare', 'Data analytics'],
    url: 'https://referendo.com',
  },
  {
    name: 'Python Learning Materials',
    description:
      'Various resources for learning the Python programming language, including code examples, exercises, and projects. Whether you are a beginner or an experienced programmer, you will find something useful here to help you improve your Python skills.',
    icon: 'book',
    tags: ['Python', 'Education'],
    url: 'https://theoparashkevov.github.io/python-learning-materials/',
  },
  {
    name: 'Telegram Resource Management Bot',
    description: 'A resource management bot service for Linux written in C/C++.',
    icon: 'code',
    tags: ['C/C++', 'Linux', 'Telegram'],
    url: 'https://github.com/theoparashkevov/TelegramBot-C-CPP',
  },
];

export function displayUrl(url: string): string {
  const { hostname, pathname } = new URL(url);
  return `${hostname.replace(/^www\./, '')}${pathname.replace(/\/$/, '')}`;
}
