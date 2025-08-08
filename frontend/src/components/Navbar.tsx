import {
    Navbar,
    NavBody,
    NavItems,
    NavbarLogo,
    NavbarButton,
  } from "./ui/resizable-navbar";
import {SignUpButton } from "@clerk/clerk-react";

  export default function NavbarDemo() {
    const navItems = [
      {
        name: "Features",
        link: "#features",
      },
      {
        name: "About",
        link: "#about",
      },
      {
        name: "Contact",
        link: "#contact",
      },
    ];  
  
    return (
      <div className="w-full px-10">
        <Navbar>
          {/* Desktop Navigation */}
          <NavBody>
            <NavbarLogo/>
            <NavItems className="text-md" items={navItems} />
            <div className="flex items-center gap-4">
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <NavbarButton variant="primary" className="font-semibold text-[15px]">Login/SignUp</NavbarButton>
            </SignUpButton>
            </div>
          </NavBody>
        </Navbar>
        {/* Navbar */}
      </div>
    );
  }
  
 