import { FileText, Mail, Trophy, Zap, CreditCard } from 'lucide-react';

interface Props {
  activeRfps: number;
  quotesReceived: number;
  awarded: number;
  ongoing: number;
  paymentsDue: number;
}

export default function BuyerStats({ activeRfps, quotesReceived, awarded, ongoing, paymentsDue }: Props) {
  const items = [
    { label: 'Active RFPs', value: activeRfps, icon: FileText },
    { label: 'Quotes Received', value: quotesReceived, icon: Mail },
    { label: 'Awarded Providers', value: awarded, icon: Trophy },
    { label: 'Ongoing Projects', value: ongoing, icon: Zap },
    { label: 'Payments Due', value: `$${paymentsDue.toLocaleString()}`, icon: CreditCard },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-start shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{item.label}</p>
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
          </div>
          <item.icon className="text-gray-400" size={20} />
        </div>
      ))}
    </div>
  );
}