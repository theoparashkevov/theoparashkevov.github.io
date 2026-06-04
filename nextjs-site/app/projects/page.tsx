import { getPageBySlug } from '@/lib/content/loader';
import { markdownToHtml } from '@/lib/markdown/processor';
import { notFound } from 'next/navigation';

export default async function ProjectsPage() {
  const page = getPageBySlug('projects');
  
  if (!page) {
    notFound();
  }
  
  // Convert markdown to HTML
  const htmlContent = await markdownToHtml(page.content);
  
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{page.title}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          A selection of my recent work and contributions.
        </p>
        <div className="h-1 w-24 bg-blue-600 dark:bg-blue-400 mt-4"></div>
      </header>
      
      <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
      
      {/* Enhanced projects showcase */}
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Machine Learning Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="text-blue-600 dark:text-blue-400 text-2xl mb-3">🤖</div>
              <h3 className="text-xl font-semibold mb-2">NLP Chatbot System</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Built a conversational AI using transformer models with custom training pipelines
                and deployment on cloud infrastructure.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  Python
                </span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                  PyTorch
                </span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                  AWS
                </span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="text-green-600 dark:text-green-400 text-2xl mb-3">📈</div>
              <h3 className="text-xl font-semibold mb-2">Time Series Forecasting</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Developed production forecasting models using Prophet and deep learning
                approaches for business intelligence applications.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  Facebook Prophet
                </span>
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs">
                  TensorFlow
                </span>
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
                  Pandas
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Software Engineering</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="text-orange-600 dark:text-orange-400 text-2xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold mb-2">High-Performance API</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Designed and implemented a scalable REST API serving ML models with
                rate limiting, caching, and monitoring capabilities.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  FastAPI
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-full text-xs">
                  Redis
                </span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                  Docker
                </span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="text-purple-600 dark:text-purple-400 text-2xl mb-3">🔧</div>
              <h3 className="text-xl font-semibold mb-2">DevOps Automation</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Created CI/CD pipelines and infrastructure as code for automated
                deployment of machine learning models and applications.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-xs">
                  GitHub Actions
                </span>
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
                  Terraform
                </span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  Kubernetes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-bold mb-6">Open Source Contributions</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          I actively contribute to open source projects and maintain several personal
          projects focused on machine learning utilities and developer tools.
        </p>
        <a
          href="https://github.com/theoparashkevov"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-gray-900 dark:bg-gray-800 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        >
          <span>View GitHub Profile</span>
          <svg className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  );
}