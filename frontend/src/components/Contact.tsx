import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"; // Adjust path as needed

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowToast(true);
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setShowToast(false), 4000);
      }
    } catch {
      alert("Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 px-6 md:px-20 relative">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-emerald-700">Contact Me</CardTitle>
          <CardDescription>
            Have questions? Need guidance? We're here to help you plan smarter.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your Email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={5}
              placeholder="Your Message"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </CardContent>

          <CardFooter>
            <button
              type="submit"
              disabled={loading}
              className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md font-semibold transition"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </CardFooter>
        </form>
      </Card>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-5 border border-green-300 right-5 text-green-500 bg-white px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in-up z-50">
           Message sent successfully!
        </div>
      )}
    </section>
  );
};

export default Contact;
