export default function BillingSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-4">Your subscription has been upgraded.</p>
        <a href="/overview" className="text-blue-600 underline">Return to Dashboard</a>
      </div>
    </div>
  );
}
