'use client';

import { useState } from 'react';

export default function ROICalculatorPage() {
  const [revenue, setRevenue] = useState(100000);
  const [aov, setAov] = useState(75);
  
  const aiRevenue = revenue * 0.25;
  const additionalRevenue = aiRevenue - (revenue * 0.05);
  const annualValue = additionalRevenue * 12;
  const roi = (annualValue / 3588) * 100;

  return (
    <div className="py-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-center mb-16">ROI Calculator</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Revenue</label>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-2xl font-bold mt-2">${revenue.toLocaleString()}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Average Order Value</label>
              <input
                type="range"
                min="25"
                max="500"
                step="5"
                value={aov}
                onChange={(e) => setAov(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-2xl font-bold mt-2">${aov}</p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Your Potential Results</h3>
            <div className="space-y-3">
              <p className="text-lg">Additional Monthly Revenue: <span className="font-bold text-green-600">${additionalRevenue.toLocaleString()}</span></p>
              <p className="text-lg">Annual Value: <span className="font-bold text-green-600">${annualValue.toLocaleString()}</span></p>
              <p className="text-lg">ROI: <span className="font-bold text-green-600">{roi.toFixed(0)}%</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
