import { getPageBySlug } from '@/lib/content/loader';
import { markdownToHtml } from '@/lib/markdown/processor';
import { sanitizeHTML } from '@/lib/utils/sanitize-html';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { generateSEO } from '@/lib/seo/metadata';

export const metadata: Metadata = generateSEO({
  title: 'Projects',
  description: 'Explore projects and work by Teo Parashkevov in machine learning, backend development, and more.',
  url: '/projects/',
});

export default async function ProjectsPage() {
  const page = getPageBySlug('projects');
  
  if (!page) {
    notFound();
  }
  
  // Convert markdown to HTML and sanitize for XSS prevention
  const htmlContent = sanitizeHTML(await markdownToHtml(page.content));
  
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-800">{page.title}</h1>
        <p className="text-xl text-neutral-600">
          A selection of my recent work and contributions.
        </p>
        <div className="h-1 w-24 bg-primary mt-4"></div>
      </header>
      
      <div className="prose prose-lg max-w-none mb-12">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
      
      {/* Enhanced projects showcase */}
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-neutral-800">Machine Learning Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6">
              <div className="text-primary text-2xl mb-3">🤖</div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-800">NLP Chatbot System</h3>
              <p className="text-neutral-600 mb-4">
                Built a conversational AI using transformer models with custom training pipelines
                and deployment on cloud infrastructure.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  Python
                </span>
                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
                  PyTorch
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  AWS
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6">
              <div className="text-secondary text-2xl mb-3">📈</div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-800">Time Series Forecasting</h3>
              <p className="text-neutral-600 mb-4">
                Developed forecasting models for financial data using Prophet and custom neural
                networks with 95%+ accuracy.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  Python
                </span>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                  TensorFlow
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  Pandas
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-neutral-800">Infrastructure & Backend</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6">
              <div className="text-accent text-2xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-800">API Performance Optimization</h3>
              <p className="text-neutral-600 mb-4">
                Reduced API response times by 80% through query optimization, caching strategies,
                and async processing.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  FastAPI
                </span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs">
                  Redis
                </span>
                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
                  PostgreSQL
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6">
              <div className="text-purple-600 text-2xl mb-3">🔧</div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-800">CI/CD Pipeline Automation</h3>
              <p className="text-neutral-600 mb-4">
                Implemented automated testing, deployment, and monitoring pipelines reducing
                manual deployment time by 90%.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs">
                  Docker
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  GitHub Actions
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  AWS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contact CTA */}
      <div className="mt-12 pt-8 border-t border-neutral-200">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-neutral-600 mb-4">
            Interested in collaborating or learning more about my work?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Get in touch →
          </a>
        </div>
      </div>
    </div>
  );
}