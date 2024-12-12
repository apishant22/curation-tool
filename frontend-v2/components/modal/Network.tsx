"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import {toast} from "react-hot-toast";
import { useRouter } from "next/navigation";

const ForceGraph3D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  { ssr: false }
);

interface NetworkProps {
    authorName: string;
    width: number;
    height: number;
    graphConfig?: {
        nodeColor?: string;
        nodeActiveColor?: string;
        linkColor?: string;
        nodeDiameter?: number | undefined;
        centerNodeColor?: string;
    };
};

const AuthorNetwork: React.FC<NetworkProps> = ({
    authorName,
    width,
    height,
    graphConfig={
        nodeColor:"#2196F3",
        nodeActiveColor: "#4DAF83",
        linkColor: "#9E9E9E",
        nodeDiameter: 4,
        centerNodeColor: "#4CBFF3",
    },
    }
) => {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  // Fetch the graph data from the backend
  useEffect(() => {
    const fetchAuthorNetwork = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3002/network/${authorName}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setGraphData(data);
      } catch (error) {
        console.error("Error fetching graph data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthorNetwork();
  }, [authorName, width, height]);


  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center space-x-2">
              <div className="w-5 h-5 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 dark:text-neutral-400 text-lg">
                         Loading author network ...
              </span>
          </div>
      );
  }
    if (!graphData) {
        return (
            <div className="flex items-center justify-center h-20 space-x-2">
                <div className="text-center text-red-600">
                    Error loading network
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef}
             style={{
                 width: "100%",
                 height: "100%",
                 margin: "0 auto",
                 position: "relative",
                 overflow: "hidden",
             }}>
            <div>
                {/*Main body*/}
                <ForceGraph3D
                    graphData={graphData}
                    nodeLabel={(node) => node.name || node.id}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const label = node.name || node.id;
                        const fontSize = 12 / globalScale;
                        //const isHovered = node.id === hoveredNode?.id;
                        const nodeColor =
                            //isHovered ? graphConfig.nodeActiveColor :
                            node.name === authorName ? graphConfig.centerNodeColor :
                            graphConfig.nodeColor;

                        if (node.x === undefined || node.y === undefined) {
                            return;
                        }
                        // Draw the node (default style)
                        ctx.fillStyle = nodeColor || node.color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, graphConfig.nodeDiameter, 0, 2 * Math.PI, false);
                        ctx.fill();

                        // Add the label below the node
                        ctx.font = `${fontSize}px Sans-Serif`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "top";
                        ctx.fillStyle = nodeColor || node.color; // Use the same color as the node
                        ctx.fillText(label, node.x, node.y + graphConfig.nodeDiameter + 2);
                    }}
                    //onNodeHover={(node) => setHoveredNode(node)}
                    // Link styling
                    linkColor={graphConfig.linkColor}
                    linkWidth={1.5}
                    nodeAutoColorBy="group"
                    onNodeClick={(node) =>
                        //(node) => {if (node?.link) window.open(node.link, "_blank");}
                        {
                            const profileIdMatch = node.link.match(/profile\/(\d+)$/);
                            const profileId = profileIdMatch ? profileIdMatch[1] : "";
                            const formattedName = node.name.trim().replace(/\s+/g, " ").toLowerCase();
                            const searchParams = new URLSearchParams({
                                name: formattedName,
                                profileId: profileId,
                            });
                            if (!profileId) {
                                toast.error("Invalid profile link.");
                                return;
                            }
                            toast.success(
                                "Item has been successfully clicked! Redirecting to the details page."
                            );
                            router.push(`/summary?${searchParams.toString()}`);
                        }
                    }
                    width={width}
                    height={height}
                    backgroundColor="rgba(250,250,250,1)"
                    enablePointerInteraction={true}
                />
            </div>
        </div>
    );
};

export default AuthorNetwork;
