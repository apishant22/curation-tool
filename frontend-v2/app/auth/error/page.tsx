"use client";

import Container from "@/components/global/Container";
import Logo from "@/components/navbar/Logo";

import React from "react";

import { MdError } from "react-icons/md";
import background from "@/public/images/geometric.jpg";
import { IoArrowBack } from "react-icons/io5";

import Link from "next/link";

const SignInPage = () => {
  return (
    <div
      className="flex justify-center items-center h-full"
      style={{
        backgroundImage: `url(${background.src})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        width: "100vw",
        height: "100vh",
      }}>
      <Container>
        <div className="w-[500px] h-fit flex flex-col items-center justify-center gap-4 p-4 bg-white rounded-xl">
          <div>
            <Logo />
          </div>
          <hr className="w-full" />

          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-center justify-center">
              <MdError size={50} className="text-red-700" />
              <div className="text-center font-bold text-3xl">
                Access Denied
              </div>
            </div>
            <div className="text-sm text-neutral-600">
              Please contact whitelisted ACM-W members to have access to this
              tool.
            </div>
            <div className="w-fit">
              <Link href="/auth/login">
                <IoArrowBack
                  size={20}
                  className="hover:text-neutral-500 transition duration-150"
                />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default SignInPage;
