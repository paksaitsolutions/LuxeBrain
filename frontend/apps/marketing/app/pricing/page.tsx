import { Button } from '@luxebrain/ui';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: 99,
    features: ['Up to 500 products', '5K recommendations/mo', 'Email support', 'Basic analytics'],
  },
  {
    name: 'Growth',
    price: 299,
    features: ['Up to 2K products', '50K recommendations/mo', 'Priority support', 'Advanced analytics', 'A/B testing'],
    popular: true,
  },
  {
    name: 'Pro',
    price: 799,
    features: ['Unlimited products', 'Unlimited recommendations', 'Dedicated support', 'Custom models', 'White-label'],
  },
];

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-center mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-center text-gray-600 mb-16">14-day free trial. No credit card required.</p>
        
        <div className="grid grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white p-8 rounded-lg shadow-lg ${plan.popular ? 'ring-2 ring-blue-600' : ''}`}
            >
              {plan.popular && (
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Most Popular</span>
              )}
              <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
              <p className="text-4xl font-bold mt-4">${plan.price}<span className="text-lg text-gray-600">/mo</span></p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="http://localhost:3000/signup">
                <Button className="w-full mt-8">Start Free Trial</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
