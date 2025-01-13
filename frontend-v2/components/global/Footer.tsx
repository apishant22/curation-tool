"use client";

import React from "react";
import Logo from "../navbar/Logo";
import Container from "./Container";
import { FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

const Footer = () => {
  new Date().getFullYear();
  return (
    <div className=" max-w-screen bg-neutral-200 dark:bg-zinc-900">
      <Container>
        <div className="text-gray">
          <div className="flex flex-row justify-between items-center p-3 md:gap-6">
            <div className="flex flex-col items-center justify-start pl-10 pt-10">
              <Logo />
              <div className="flex gap-6 pt-4 items-center">
                <a href="https://www.instagram.com/acmwomen/" target="_blank">
                  <FaInstagram size={36} color="b1b1b1" />
                </a>
                <a
                  href="https://www.linkedin.com/company/acm-w-acms-women-in-computing/"
                  target="_blank">
                  <FaLinkedin size={36} color="b1b1b1" />
                </a>
                <a href="http://twitter.com/officialacmw" target="_blank">
                  <FaTwitter size={36} color="#b1b1b1" />
                </a>
              </div>
            </div>
            <div className="items-end pr-40">
              <div className="m-auto flex flex-col py-10">
                <section className="flex gap-20 w-[100%] h-[100%] border-black">
                  <ul className="flex flex-col gap-2">
                    <h5 className="text-[16px] mb-1 uppercase tracking-widest font-bold">
                      Help
                    </h5>
                    <li className="font-CourierPrime text-xs">
                      <a
                        href="https://women.acm.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline">
                        User Manual
                      </a>
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Footer;
