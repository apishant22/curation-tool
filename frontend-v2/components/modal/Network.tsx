/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
    centerNodeDiameter?: number | undefined;
    nodeDiameter?: number | undefined;
    centerNodeColor?: string;
  };
}
const { useRef } = React;
const AuthorNetwork: React.FC<NetworkProps> = ({
  authorName,
  width,
  height,
  graphConfig = {
    nodeColor: "#207AF6",
    nodeActiveColor: "#2196F3",
    linkColor: "#AFAF83",
    nodeDiameter: 6,
    centerNodeDiameter: 10,
    centerNodeColor: "#4CBFF3",
  },
}) => {
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fgRef = useRef<any>(null);
  const img = new Image();
  img.src = "./images/avatar.png";

  const parseLink = (link: string) => {
    const profileIdMatch = link.match(/profile\/(\d+)$/);
    return profileIdMatch ? profileIdMatch[1] : null;
  };

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const containerRef = useRef<HTMLDivElement>(null);
  // Fetch the graph data from the backend
  useEffect(() => {
    const fetchAuthorNetwork = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/network/${authorName}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setGraphData(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error("Error fetching graph data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthorNetwork();
  }, [authorName, width, height]);

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      // Explicit null check for fgRef.current
      if (!fgRef.current) {
        return;
      }

      // Now fgRef.current is guaranteed to be non-null
      const graphBbox = fgRef.current.getGraphBbox();

      // Check if graphBbox is not null or undefined and has an 'x' property
      if (graphBbox?.x) {
        fgRef.current.zoomToFit(100, 50);
        count += 1;
        if (count > 100) {
          clearInterval(interval);
        }
      }
    }, 10);

    return () => {
      clearInterval(interval);
    };
  }, [graphData]);

  if (loading) {
    return (
      <div
        ref={containerRef}
        style={{
          width: width,
          height: height,
          margin: "0 auto",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(250,250,250,0.1)",
        }}>
        <div className="flex flex-row items-center justify-center space-x-2">
          <div className="w-5 h-5 border-4 border-gray-400 border-t-transparent rounded-full animate-spin text-blue-500"></div>
          <span className="text-gray-600 dark:text-neutral-400 text-lg animate-pulse">
            Loading author network ...
          </span>
        </div>
      </div>
    );
  }
  if (!graphData) {
    return (
      <div
        ref={containerRef}
        style={{
          width: width,
          height: height,
          margin: "0 auto",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(250,250,250,0.1)",
        }}>
        <div className="min-h-[50vh] flex items-center justify-center h-20 space-x-2 max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="ml-2">Error</AlertTitle>
            <AlertDescription className="mt-2">
              We couldn&apos;t load the network data. This might be due to a
              network issue or the content might be unavailable.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  const nodeCount = graphData.nodes.length;
  const linkCount = graphData.links.length;
  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-end",
          padding: "10px 10px",
          position: "absolute",
          gap: 10,
          top: 0,
          right: 0,
          zIndex: 10,
        }}>
        <div>
          <div className="p-1 font-sans font-semibold text-blue-600 rounded-md">
            <span>Co-authors: {nodeCount - 1} </span>
          </div>
        </div>
        <div>
          <div className="p-1 font-sans font-semibold text-blue-600 rounded-md">
            <span> Relations: {linkCount}</span>
          </div>
        </div>
      </div>

      <div>
        {/*Main body*/}
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeLabel={(node) => node.name || node.id}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name || node.id;
            const fontSize = 12 / globalScale;
            //const isHovered = node.id === hoveredNode?.id;
            const nodeColor =
              //isHovered ? graphConfig.nodeActiveColor :
              node.name === authorName
                ? graphConfig.centerNodeColor
                : graphConfig.nodeColor;

            const nodeDiameter =
              node.name === authorName
                ? graphConfig.centerNodeDiameter // Use centerNodeDiameter for the center node
                : graphConfig.nodeDiameter;

            if (node.x === undefined || node.y === undefined) {
              return;
            }

            // Draw the node (default style)

            if (img.complete) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              if (!nodeDiameter) {
                return;
              }
              ctx.drawImage(
                img,
                node.x - nodeDiameter / 2,
                node.y - nodeDiameter / 2,
                nodeDiameter,
                nodeDiameter
              );
            }
            ctx.fillStyle = nodeColor || node.color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment

            ctx.arc(node.x, node.y, nodeDiameter / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Add the label below the node
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = nodeColor || node.color;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment

            ctx.fillText(label, node.x, node.y + nodeDiameter + 1);
          }}
          //onNodeHover={(node) => setHoveredNode(node)}
          // Link styling
          linkColor={graphConfig.linkColor}
          linkWidth={1.5}
          nodeAutoColorBy="group"
          onNodeClick={(node) =>
            //(node) => {if (node?.link) window.open(node.link, "_blank");}
            {
              if (node?.link)
                window.open(
                  `${BASE_URL}/summary?name=${encodeURI(
                    node.name
                  )}&profileId=${parseLink(node.link)}`,
                  "_blank"
                );
              console.log(
                `${BASE_URL}/summary?name=${encodeURI(
                  node.name
                )}&profileId=${parseLink(node.link)}`
              );
            }
          }
          width={width}
          height={height}
          backgroundColor="rgba(250,250,250,0.2)"
          enablePointerInteraction={true}
        />
      </div>
    </div>
  );
};

export default AuthorNetwork;
