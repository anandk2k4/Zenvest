import { FaGithub, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="w-full py-10 px-6 md:px-20 bg-zinc-200 border-t mix-blend-overlay md:mix-blend-overlay">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-10 text-gray-700 ">

        {/* Left - Logo & Tagline */}
        <div className="text-center md:text-left ">
          <a href="/" className="flex items-center gap-2 pl-10">
            <img src="/investment.png" alt="logo" height={25} width={25} />
            <h2 className="text-xl font-bold text-gr-800">ZenVest</h2>
          </a>
          <p className="text-sm mt-0 text-emerald-500 pl-18">Plan. Save. Grow.</p>
            <p className="text-sm text-zinc-700 pt-5">&copy; {new Date().getFullYear()} ZenVest. All rights reserved.</p>
        </div>

        {/* Center - Navigation */}
        <div className="text-center">
          <h3 className="text-md font-semibold text-gray-700 mb-2 underline">Products</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li><a href="#features" className="hover:text-emerald-500 transition">Features</a></li>
            <li><a href="#about" className="hover:text-emerald-500 transition">About</a></li>
            <li><a href="#contact" className="hover:text-emerald-500 transition">Contact</a></li>
          </ul>
        </div>

        {/* Right - Social Icons with Tooltips */}
        <div className="flex flex-row items-center md:items-end my-4">
          <h3 className="text-md font-semibold text-gray-700 mr-4 mb-1">Connect -</h3>
          <div className="flex gap-4">
            {/* GitHub */}
            <a
              href="https://github.com/anandk2k4"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="text-gray-600 hover:text-black transition p-2 rounded-full border border-gray-300 hover:border-black shadow-sm hover:shadow-md"
            >
              <FaGithub size={20} />
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com/in/your-linkedin"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              className="text-gray-600 hover:text-blue-700 transition p-2 rounded-full border border-gray-300 hover:border-blue-700 shadow-sm hover:shadow-md"
            >
              <FaLinkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
