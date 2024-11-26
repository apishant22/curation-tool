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
            <HomeLogo />
            <Search />
            <div className="text-neutral-400 text-sm flex gap-2 pb-10">
              <span>
                <MdOutlineInsights size={20} />
              </span>
              Supporting, celebrating and advocating for women in computing
            </div>
          </div>

          {/* AuthorNetwork */}
          <div className="text-center pt-10">
            <AuthorNetwork />
            <h1 className="text-2xl font-bold mb-5 ">
              Author Collaboration Network
            </h1>
          </div>
          {/*
          <div className="flex flex-grow flex-col gap-10 items-center justify-center pt-12 pb-12">
            { response &&
              response.map((res) => {
                return (
                  <ContentCard
                    key={res.id}
                    name={res.name}
                    summary={res.summary}
                    orcid={res.orcid}></ContentCard>
                );
              })}
            </div> */}
        </Container>
      </ClientOnly>
    </div>
  );
};

export default Page;
