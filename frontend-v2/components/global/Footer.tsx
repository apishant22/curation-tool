"use client";

import React from "react";
import Logo from "../navbar/Logo";
import Container from "./Container";
import { FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

const Footer = () => {
    new Date().getFullYear();
    return (

    <div className="z-10 max-w-screen border-t-[1px] bg-neutral-600 dark:bg-zinc-900 shadow-sm">
      <Container>
      <div className='text-gray'>
        <div className="flex flex-row justify-between p-3 md:gap-6">
          <div className="flex flex-col items-start justify-start pl-10 pt-10">
            <Logo />
            <div className="flex gap-6 pt-4 items-center">
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
            <div className='items-end pr-20'>
                <div className='m-auto flex flex-col py-14'>
                    <section className='flex gap-40 w-[100%] h-[100%] border-black'>
                        <ul className='flex flex-col gap-2'>
                            <h5 className='text-[16px] mb-1 uppercase tracking-widest font-bold'>Ethic</h5>
                            <li className='font-CourierPrime text-xs'>Development team</li>
                        </ul>
                        <ul className='flex flex-col gap-2'>
                            <h5 className='text-[16px] mb-1 uppercase tracking-widest font-bold'>Brand</h5>
                            <li className='font-CourierPrime text-xs'>ACM-W</li>
                        </ul>
                        <ul className='flex flex-col gap-2'>
                            <h5 className='text-[16px] mb-1 uppercase tracking-widest font-bold'>Help</h5>
                            <li className='font-CourierPrime text-xs'>FAQ</li>
                            <li className='font-CourierPrime text-xs'>Contact Us</li>
                        </ul>
                    </section>

                  <div className='items-end text-[12px] font-bold py-20'>
                    <ul className='flex gap-7'>
                        <span>copyright© 2024</span>
                        {/*<a href='/' className='underline font-CourierPrime'>Content to add</a>*/}
                    </ul>
                </div>
                </div>
                
            </div>
        </div>
        </div>
      </Container>
    </div>
  );
};

export default Footer;
