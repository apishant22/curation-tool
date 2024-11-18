import ClientOnly from "@/components/global/ClientOnly";
import Container from "@/components/global/Container";
import HomeLogo from "@/components/global/HomeLogo";
import ContentCard from "@/components/homepage/ContentCard";
import Search from "@/components/navbar/Search";
import React from "react";
import { MdOutlineInsights } from "react-icons/md";

export const response = [
  {
    id: 1,
    name: "Adriana Wilde",
    summary:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corporis, enim doloremque! Nisi aspernatur quia minima magni illum quidem amet maxime repellat in, vitae, ad nesciunt adipisci dolores, temporibus quod consequuntur!",
    orcid: 12049353,
  },
  {
    id: 2,
    name: "John Doe",
    summary:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corporis, enim doloremque! Nisi aspernatur quia minima magni illum quidem amet maxime repellat in, vitae, ad nesciunt adipisci dolores, temporibus quod consequuntur!",
    orcid: 12049353,
  },
  {
    id: 3,
    name: "Jane Doe",
    summary:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corporis, enim doloremque! Nisi aspernatur quia minima magni illum quidem amet maxime repellat in, vitae, ad nesciunt adipisci dolores, temporibus quod consequuntur!",
    orcid: 12049353,
  },
];

const page = () => {
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

          <div className="flex flex-grow flex-col gap-10 items-center justify-center pt-12 pb-12">
            {response &&
              response.map((res) => {
                return (
                  <ContentCard
                    key={res.id}
                    name={res.name}
                    summary={res.summary}
                    orcid={res.orcid}></ContentCard>
                );
              })}
          </div>
        </Container>
      </ClientOnly>
    </div>
  );
};

export default page;
