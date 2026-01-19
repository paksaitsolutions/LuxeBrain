import { Button } from '@luxebrain/ui';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: 99,
    features: [
      'Up to 500 products',
      '5K recommendations/mo',
      'Email support',
      'Basic analytics',
      'AI chatbot',
    ],
    limits: '500 products, 5K recommendations',
    roi: '20x ROI',
  },
  {
    name: 'Growth',
    price: 299,
    features: [
      'Up to 2K products',
      '50K recommendations/mo',
      'Priority support',
      'Advanced analytics',
      'A/B testing',
      'Dynamic pricing',
    ],
    popular: true,
    limits: '2K products, 50K recommendations',
    roi: '40x ROI',
  },
  {
    name: 'Pro',
    price: 799,
    features: [
      'Unlimited products',
      'Unlimited recommendations',
      'Dedicated support',
      'Custom models',
      'White-label',
      'API access',
    ],
    limits: 'Unlimited',
    roi: '60x ROI',
  },
  {
    name: 'Enterprise',
    price: null,
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise deployment',
    ],
    limits: 'Custom',
    roi: 'Custom ROI',
  },
];

const faqs = [
  {
    q: 'How does the free trial work?',
    a: '14 days free, no credit card required. Full access to all features.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Yes, upgrade or downgrade anytime. Changes take effect immediately.',
  },
  {
    q: 'What if I exceed my limits?',
    a: "We'll notify you before limits. You can upgrade or purchase add-ons.",
  },
  {
    q: 'Do you offer refunds?',
    a: "30-day money-back guarantee if you're not satisfied.",
  },
];

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="max-w-7xl mx-auto px-4 text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600">14-day free trial. No credit card required. Cancel anytime.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 mb-24">
        <div className="grid grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white p-8 rounded-lg shadow-lg relative ${
                plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                {plan.price ? (
                  <>
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-600">/mo</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold">Custom</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">{plan.limits}</p>
              <p className="text-sm font-semibold text-green-600 mb-6">{plan.roi}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <span className="text-green-600 mr-2 mt-1">✓</span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.price ? '/signup' : '/demo'}>
                <Button className="w-full">
                  {plan.price ? 'Start Free Trial' : 'Contact Sales'}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 py-16 mb-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">How We Calculate ROI</h2>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">+15%</p>
              <p className="text-gray-600">Average Order Value increase</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-purple-600 mb-2">+25%</p>
              <p className="text-gray-600">Conversion Rate lift</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-pink-600 mb-2">-28%</p>
              <p className="text-gray-600">Cart abandonment reduction</p>
            </div>
          </div>
          <p className="text-gray-600 mt-8">
            Based on average results from 100+ fashion stores using LuxeBrain AI
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
