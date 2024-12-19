"use client";
import Container from "@/components/global/Container";
import React from "react";
import { MdError } from "react-icons/md";

const SignInPage = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <Container>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 items-center justify-center">
            <MdError size={50} className="text-red-700" />
            <div className="text-center font-bold text-3xl">Access Denied</div>
          </div>
          <div>
            Please contact verified ACM-W members to have access to this tool.
          </div>
        </div>
      </Container>
    </div>
  );
};

export default SignInPage;
