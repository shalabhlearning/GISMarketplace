// src/components/subscription/SubscriptionAlert.tsx
import Link from 'next/link';

export default function SubscriptionAlert() {
  return (
    <div className="border border-red-200 bg-red-50 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-red-700 flex items-center gap-2 text-lg">
          <span className="text-2xl">⚠</span> Subscription Required!
        </p>
        <p className="text-red-600 mt-1">
          Your account does not have an active subscription. Please subscribe to unlock full features.
        </p>
      </div>
      <Link 
        href="/subscribe"
        className="bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-lg transition text-center"
      >
        Subscribe Now
      </Link>
    </div>
  );
}