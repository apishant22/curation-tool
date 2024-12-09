"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

const ForceGraph3D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  { ssr: false }
);

const AuthorNetwork = () => {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  // const hoveredNode = useRef<NodeData | null>(null);
  // Reference to ForceGraph2D component for zooming functions
  //const fgRef = useRef<any>(null);

  // Fetch the graph data from the backend
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await fetch("http://localhost:3002/graph");
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
    fetchGraph();
  }, []);

  // Custom node object with color configuration
  const graphConfig = {
    nodeColor: "#2196F3", // Default node color (blue)
    nodeActiveColor: "#4CAF50", // Hover node color (green)
    linkColor: "#9E9E9E", // Default link color (gray)
    nodeDiameter: 8, // Size of the nodes
  };

  // const handleNodeHover = (node: NodeData | null) => {
  //     // Reset the previous hovered node to default color
  //     if (hoveredNode.current && hoveredNode.current !== node) {
  //         hoveredNode.current.color = graphConfig.nodeColor;
  //     }

  //     // Set the new hovered node color
  //     if (node) {
  //         node.color = graphConfig.nodeActiveColor;
  //         hoveredNode.current = node;
  //     } else if (hoveredNode.current) {
  //         // If no node is being hovered, reset the last hovered node
  //         hoveredNode.current.color = graphConfig.nodeColor;
  //         hoveredNode.current = null;
  //     }
  // };

  if (loading) return <div> Loading... </div>;
  if (!graphData) return <div> Error loading graph</div>;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
        //border: "1px solid #ccc",
      }}>
      {/*Main body*/}
      <ForceGraph3D
        //ref={fgRef}
        graphData={graphData}
        nodeLabel={(node) => `
                    <div style="color: gray; font-weight: bold;">
                        ${node.name || node.id}
                    </div>
                `}
        // Node styling
        nodeColor={(node) => node.color || graphConfig.nodeColor}
        //nodeRelSize={graphConfig.nodeDiameter}

        // Link styling
        linkColor={graphConfig.linkColor}
        linkWidth={1.5}
        // Node interaction
        //onNodeHover={handleNodeHover}
        nodeAutoColorBy="id"
        onNodeClick={(node) => {
          if (node?.link) window.open(node.link, "_blank");
        }}
        width={800}
        height={400}
        backgroundColor="rgba(250,250,250,1)"
      />
    </div>
  );
};

export default AuthorNetwork;
