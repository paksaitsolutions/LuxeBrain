import { Button } from '@luxebrain/ui';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white py-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold mb-6">
            AI That Grows Your WooCommerce Revenue
          </h1>
          <p className="text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            Increase AOV by 15%, conversion by 25%, and ROI by 300%+ with AI-powered recommendations, dynamic pricing, and automation.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">Start Free Trial</Button>
            </Link>
            <Link href="/demo">
              <Button variant="secondary" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold">Request Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-blue-600">+15%</p>
              <p className="text-gray-600 mt-2">Average Order Value</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-purple-600">+25%</p>
              <p className="text-gray-600 mt-2">Conversion Rate</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-pink-600">300%+</p>
              <p className="text-gray-600 mt-2">Return on Investment</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-green-600">92%</p>
              <p className="text-gray-600 mt-2">Model Accuracy</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Download Plugin</h3>
              <p className="text-gray-600 mb-4">Install our WooCommerce plugin in 2 minutes</p>
              <a href="/luxebrain-ai.zip" download className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">
                Download Plugin
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">AI Learns Behavior</h3>
              <p className="text-gray-600">Models analyze customer patterns and preferences</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-pink-600">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Revenue Grows</h3>
              <p className="text-gray-600">Automated recommendations, pricing, and campaigns</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Powerful AI Features</h2>
          <div className="grid grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-2xl font-bold mb-4">AI Recommendations</h3>
              <p className="text-gray-600">Personalized product suggestions that increase AOV by 12-18%</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-2xl font-bold mb-4">Outfit Matching</h3>
              <p className="text-gray-600">Complete-the-look suggestions for fashion stores</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-2xl font-bold mb-4">Dynamic Pricing</h3>
              <p className="text-gray-600">AI-optimized discounts that maximize margins</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-2xl font-bold mb-4">AI Chatbot</h3>
              <p className="text-gray-600">24/7 style advisor and customer support</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-2xl font-bold mb-4">Marketing Automation</h3>
              <p className="text-gray-600">Abandoned cart recovery and email campaigns</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-2xl font-bold mb-4">ROI Dashboard</h3>
              <p className="text-gray-600">Real-time analytics showing AI-driven revenue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Built for WooCommerce Fashion Stores</h2>
          <div className="grid grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">DTC Brands</h3>
              <p className="text-gray-600">$50K-$500K/month revenue, 200-2000 products</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Fashion Retailers</h3>
              <p className="text-gray-600">Women's fashion, accessories, lifestyle brands</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 mb-8">Plans starting at $99/month. 14-day free trial.</p>
          <Link href="/pricing">
            <Button size="lg">View Pricing Plans</Button>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to 10x Your Revenue?</h2>
          <p className="text-xl mb-8 opacity-90">Join fashion stores growing with AI. No credit card required.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">Start Free Trial</Button>
            </Link>
            <Link href="/demo">
              <Button variant="secondary" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold">Book a Demo</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
