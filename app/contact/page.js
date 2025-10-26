import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: "Contact - Stackd",
  description: "Get in touch with the Stackd team. We'd love to hear from you!",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen w-full p-0 m-0" style={{ 
      background: 'linear-gradient(to bottom, #1a1a1a, #2a2a2a)'
    }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-block mb-6 text-gray-400 hover:text-white transition-colors">
            ← Back to Board
          </Link>
          <Image src="/Stackd.png" alt="Stackd Logo" width={192} height={48} className="mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-400">
            We&apos;d love to hear from you. Reach out with questions, feedback, or just to say hello!
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Social Media */}
          <div className="bg-[#2E3436] p-8 rounded-xl">
            <div className="mb-6">
              <svg className="w-8 h-8 text-blue-400 mb-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Twitter / X</h3>
            <p className="text-gray-400 mb-4">
              Follow us for updates, tips, and news about Stackd.
            </p>
            <a 
              href="https://x.com/Tziogadoros" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block text-blue-400 hover:text-blue-300 font-semibold"
            >
              @Tziogadoros →
            </a>
          </div>

          {/* GitHub */}
          <div className="bg-[#2E3436] p-8 rounded-xl">
            <div className="mb-6">
              <svg className="w-8 h-8 text-purple-400 mb-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">GitHub</h3>
            <p className="text-gray-400 mb-4">
              Report issues, contribute code, or star the project.
            </p>
            <a 
              href="https://github.com/Contzokas/stackd" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block text-purple-400 hover:text-purple-300 font-semibold"
            >
              View Repository →
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-[#2E3436] p-8 rounded-xl mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Questions or Feedback?</h2>
          <p className="text-gray-400 mb-6">
            We&apos;re always looking to improve Stackd. If you have suggestions, found a bug, 
            or just want to share how you&apos;re using Stackd, we&apos;d love to hear from you!
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">💡</span>
              <div>
                <h3 className="text-white font-semibold mb-1">Feature Requests</h3>
                <p className="text-gray-400 text-sm">
                  Have an idea for a new feature? Open an issue on GitHub with the &quot;enhancement&quot; label.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🐛</span>
              <div>
                <h3 className="text-white font-semibold mb-1">Bug Reports</h3>
                <p className="text-gray-400 text-sm">
                  Found a bug? Please report it on GitHub with detailed steps to reproduce.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🤝</span>
              <div>
                <h3 className="text-white font-semibold mb-1">Contributions</h3>
                <p className="text-gray-400 text-sm">
                  Want to contribute? Check out our GitHub repository and submit a pull request!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About the Creator */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 p-8 rounded-xl">
          <h2 className="text-2xl font-semibold text-white mb-4">About the Creator</h2>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Constantinos</h3>
              <p className="text-gray-400 mb-4">
                Creator and maintainer of Stackd. Passionate about building tools that enhance productivity 
                while respecting user freedom and flexibility.
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://x.com/Tziogadoros" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Twitter →
                </a>
                <a 
                  href="https://github.com/Contzokas" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  GitHub →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Board */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Board
          </Link>
        </div>
      </div>
    </main>
  );
}
