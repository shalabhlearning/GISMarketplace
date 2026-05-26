import { Users, Briefcase, Star, Building2 } from "lucide-react";

const stats = [
  {
    value: "+10k",
    label: "ACTIVE PROVIDERS",
    icon: Users,
  },
  {
    value: "$50M+",
    label: "JOBS AWARDED",
    icon: Briefcase,
  },
  {
    value: "98%",
    label: "CLIENT SATISFACTION",
    icon: Star,
  },
  {
    value: "24/7",
    label: "SUPPORT & PAYOUTS",
    icon: Building2,
  },
];

export function Stats() {
  return (
    <section className="relative bg-card pb-16 md:pb-20">
      {/* Top separator line */}
      <div className="border-t border-border/50 mb-16" />

      {/* Bottom curved divider to background */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full overflow-hidden">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 md:h-20 rotate-180"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80V40C360 80 720 80 1080 60C1260 50 1380 40 1440 30V80H0Z"
            className="fill-card"
          />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-3"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="w-7 h-7 text-primary" />
                </div>

                <div className="text-3xl md:text-4xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground tracking-wider">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}