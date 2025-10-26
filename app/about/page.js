import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: "About - Stackd",
  description: "Learn more about Stackd and how it can help you organize your work and life.",
};

export default function AboutPage() {
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
          <h1 className="text-4xl font-bold text-white mb-4">About Stackd</h1>
          <p className="text-xl text-gray-400">
            A modern task management solution designed for freedom and flexibility.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8 text-gray-300">
          {/* What is Stackd */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">What is Stackd?</h2>
            <p className="mb-4">
              Stackd is a free-form task management application that breaks away from traditional rigid layouts. 
              Unlike conventional Kanban boards, Stackd gives you complete control over your workspace by allowing 
              you to position columns anywhere on the canvas.
            </p>
            <p>
              Whether you're managing personal projects, team workflows, or just organizing your daily tasks, 
              Stackd adapts to your thinking process rather than forcing you into a predefined structure.
            </p>
          </section>

          {/* Key Features */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#2E3436] p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">🎯 Free-Form Layout</h3>
                <p className="text-sm text-gray-400">
                  Position your columns anywhere on the canvas. Create the workspace that matches your workflow.
                </p>
              </div>
              <div className="bg-[#2E3436] p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">🚀 Lightning Fast</h3>
                <p className="text-sm text-gray-400">
                  Optimized for performance with instant drag-and-drop response and smooth interactions.
                </p>
              </div>
              <div className="bg-[#2E3436] p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">💾 Auto-Save</h3>
                <p className="text-sm text-gray-400">
                  Never lose your work. Everything is automatically saved to your browser's local storage.
                </p>
              </div>
              <div className="bg-[#2E3436] p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">🎨 Clean Design</h3>
                <p className="text-sm text-gray-400">
                  Minimalist interface that keeps you focused on what matters - your tasks.
                </p>
              </div>
            </div>
          </section>

          {/* Why We Built This */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Why We Built Stackd</h2>
            <p className="mb-4">
              Traditional task management tools often impose rigid structures that don't match how people actually think 
              and work. We wanted to create something different - a tool that's as flexible as your mind.
            </p>
            <p>
              Stackd was born from the idea that productivity tools should adapt to you, not the other way around. 
              By removing constraints and giving you spatial freedom, we've created a canvas where your ideas can 
              flow naturally.
            </p>
          </section>

          {/* Technology */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Built With Modern Tech</h2>
            <p className="mb-4">
              Stackd is built with cutting-edge web technologies to ensure the best possible performance:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong className="text-white">Next.js 16</strong> - React framework for production</li>
              <li><strong className="text-white">Tailwind CSS</strong> - Modern utility-first styling</li>
              <li><strong className="text-white">React Optimization</strong> - Memoization and performance hooks</li>
              <li><strong className="text-white">Local Storage API</strong> - Client-side data persistence</li>
            </ul>
          </section>

          {/* Open Source */}
          <section className="bg-[#2E3436] p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Open Source</h2>
            <p className="mb-4">
              Stackd is open source and available on GitHub. We believe in transparency and community-driven development.
            </p>
            <a 
              href="https://github.com/Contzokas/stackd" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              View on GitHub →
            </a>
          </section>

          {/* Get Started */}
          <section className="text-center pt-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-gray-400 mb-6">
              Start organizing your tasks with complete freedom.
            </p>
            <Link 
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Board
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
