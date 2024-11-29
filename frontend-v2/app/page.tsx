"use client";

import ClientOnly from "@/components/global/ClientOnly";
import Container from "@/components/global/Container";
import HomeLogo from "@/components/global/HomeLogo";
import Search from "@/components/navbar/Search";
import AuthorNetwork from "@/components/modal/Network";
import React from "react";
import { MdOutlineInsights } from "react-icons/md";

const Page = () => {
  return (
    <div className="pt-36 flex justify-center items-center">
      <ClientOnly>
        <Container>
          <div className="border-b-[1px] flex flex-col items-center gap-10">
            <div className="pt-10 pb-10">
              <HomeLogo />
            </div>
            <div className="pl-5 pr-5">
            <Search />
            </div>
            <div className="text-neutral-400 text-sm flex gap-2 pb-10">
              <span>
                <MdOutlineInsights size={20} />
              </span>
              Supporting, celebrating and advocating for women in computing
            </div>
          </div>

          <Container>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 p-20 gap-10">
          <div className="flex flex-row gap-8 justify-between items-start">
            {/* Content: AuthorNetwork */}
            <div className="text-left">
              <h2 className="text-xl font-bold mb-5 ">
                Author Collaboration Network
              </h2>
              <div className="flex-1">
                <AuthorNetwork />
              </div>
            </div>
            {/* Content: Recommend cards*/}
            <div className="text-left">
                <h2 className="text-xl font-bold mb-5">Other Elements</h2>
              <div className="flex-1 min-w-[600px] bg-gray-50 rounded-lg p-6">
                <p className="text-neutral-600 dark:text-neutral-400">
                  Add content here ...
                </p>
              </div>
              </div>
            </div>
          </div>
        </Container>
        </Container>
      </ClientOnly>
    </div>
  );
};

export default Page;
