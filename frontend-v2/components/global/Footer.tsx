import React from "react";
import Logo from "../navbar/Logo";
import Container from "./Container";
import { FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <div className="z-10 w-full border-t-[1px] bg-neutral-600 shadow-sm">
      <Container>
        <div className="flex items-center justify-between p-3 md:gap-6">
          <Logo />
          <div className="flex gap-6 items-center">
            <FaInstagram size={36} color="white" />
            <FaLinkedin size={36} color="white" />
            <FaTwitter size={36} color="white" />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Footer;
