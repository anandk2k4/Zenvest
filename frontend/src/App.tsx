import NavbarDemo from "./components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
const App = () => (
  <>
    <NavbarDemo />
      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={<Index />} /> */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          {/* <Route path="*" element={<NotFound />} />  */}
        </Routes>
      </BrowserRouter>
    </>
);

export default App;