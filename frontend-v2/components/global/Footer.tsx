"use client";

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
            <a href="https://www.instagram.com/acmwomen/" target="_blank">
              <FaInstagram size={36} color="white" />
            </a>
            <a
              href="https://www.linkedin.com/company/acm-w-acms-women-in-computing/"
              target="_blank">
              <FaLinkedin size={36} color="white" />
            </a>
            <a href="http://twitter.com/officialacmw" target="_blank">
              <FaTwitter size={36} color="white" />
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Footer;
