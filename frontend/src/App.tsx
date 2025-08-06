import NavbarDemo from "./components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Introduction from "./components/Introduction";
import Features from "./components/Features";
import AboutZenVest from "./components/AboutZenVest";
import Footer from "./components/Footer";
import Contact from "./components/Contact";

const App = () => (
  <div className="bg-img-opacity">
    <header>
      <NavbarDemo />
    </header>
    <main>
      <Introduction />
      <Features/>
      <AboutZenVest/>
      <Contact/>
    </main>
    <footer>
      <Footer/>
    </footer>
  </div>
);

export default App;
