import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
  } from "@/components/ui/card";
  
  const features = [
    {
      title: "AI-Powered Insights",
      description: "Get real-time financial recommendations tailored to your spending habits and goals.",
    },
    {
      title: "Smart Budgeting",
      description: "Track expenses automatically and stay within budget without the headache.",
    },
    {
      title: "Goal Tracking",
      description: "Set goals, monitor progress, and stay motivated with visual trackers.",
    },
    {
      title: "Secure & Private",
      description: "Bank-grade encryption and full data privacy — your finances stay yours.",
    },
  ];
  
  const Features = () => {
    return (
      <section id="features" className="py-20 px-6 md:px-20">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-700 mb-4">
            Features to Help You Grow 💸
          </h2>
          <p className="text-gray-500 text-lg">
            ZenVest simplifies your finances with tools designed for the people and their goals.
          </p>
        </div>
  
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Optional: Add feature icons or visuals here */}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  };
  
  export default Features;
  