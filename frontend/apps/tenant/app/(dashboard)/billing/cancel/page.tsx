export default function BillingCancelPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-4">Your subscription was not changed.</p>
        <a href="/billing" className="text-blue-600 underline">Return to Billing</a>
      </div>
    </div>
  );
}
