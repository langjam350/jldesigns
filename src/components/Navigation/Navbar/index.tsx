import React from "react";
import Link from "next/link";
import Logo from "./Logo";
import Button from "./Button";

const Navbar = () => {
  return <>
    <div className="w-full h-20 bg-accent sticky top-0 navbar">
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          <Logo />
          <ul className="nav-list h-full w-auto">
            <li>
              <Link href="/smm">
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/websites" legacyBehavior>
                <p>Design</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/video-dashboard" legacyBehavior >
                <p>Videos</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/generate-posts" legacyBehavior >
                <p>Posts</p>
              </Link>
            </li>
          </ul>
          <Button />
        </div>
      </div>
    </div>
  </>;
};

export default Navbar;