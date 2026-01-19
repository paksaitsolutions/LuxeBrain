export default function CaseStudiesPage() {
  const cases = [
    {
      company: 'Fashion Boutique X',
      result: '+42% Revenue',
      description: 'Increased AOV by 18% with AI recommendations',
    },
    {
      company: 'Luxury Store Y',
      result: '+35% Conversion',
      description: 'Reduced cart abandonment by 28%',
    },
  ];

  return (
    <div className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-center mb-16">Success Stories</h1>
        
        <div className="grid grid-cols-2 gap-8">
          {cases.map((c) => (
            <div key={c.company} className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">{c.company}</h3>
              <p className="text-3xl font-bold text-green-600 mb-4">{c.result}</p>
              <p className="text-gray-600">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
