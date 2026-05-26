import { Cloud, Zap, BarChart3 } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Select a Tier",
    description:
      "Choose between Standard and Premium subscriptions. Your business name and details pre-fill securely from our verified database.",
    icon: Cloud,
  },
  {
    number: 2,
    title: "Bid on Premium Jobs",
    description:
      "Use monthly credits to submit detailed quotes with attachments. Credits are only consumed when you actively bid on open opportunities.",
    icon: Zap,
  },
  {
    number: 3,
    title: "Manage & Deliver",
    description:
      "Track utilized vs balance credits in your dashboard. Upload deliverables, manage feedback loops, and auto-invoice upon approval.",
    icon: BarChart3,
  },
];

export function HowItWorks() {
  return (
    <section className="relative bg-card">
      {/* Top curved divider */}
      <div className="absolute top-0 left-0 right-0 -translate-y-full overflow-hidden">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 md:h-20"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80V40C360 80 720 80 1080 60C1260 50 1380 40 1440 30V80H0Z"
            className="fill-card"
          />
        </svg>
      </div>

      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              How Bidding Credits Work
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
              Our transparent credit system ensures fair competition and rewards
              high-quality proposals. Choose a tier that fits your growth.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="bg-muted/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.number}. {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}