"use client";
import Button from "@/components/global/Button";
import Container from "@/components/global/Container";
import { signIn } from "next-auth/react";
import React from "react";
import { FcGoogle } from "react-icons/fc";
import background from "@/public/images/geometric.jpg";

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
        <div className="w-[450px] h-fit flex flex-col items-center justify-center gap-4 p-4 bg-white rounded-xl">
          <div className="text-center font-bold ">Login</div>
          <div className="text-neutral-700 text-sm">
            To access this tool, you must log in with your whitelisted email.
          </div>
          <Button
            outline
            label="Log in with Google"
            icon={FcGoogle}
            onClick={() => {
              return signIn("google", {
                callbackUrl: "http://localhost:3000/",
              });
            }}
          />

          <div className="text-neutral-700 text-sm">
            If your email is not whitelisted yet, please contact the appropriate
            ACM-W member to gain access.
          </div>
        </div>
      </Container>
    </div>
  );
};

export default SignInPage;
