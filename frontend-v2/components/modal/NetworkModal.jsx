"use client";

import useNetworkModal from "@/app/hooks/useNetworkModal";
import React, { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(
  () => import("react-force-graph").then((mod) => mod.ForceGraph2D),
  {
    ssr: false,
  }
);

const NetworkModal = () => {
  const [loading] = useState(false);
  const networkModal = useNetworkModal();
  const forceGraphRef = useRef();
  const [graphData] = useState({
    nodes: [
      { id: "adriana", name: "Adriana Dapena" },
      { id: "paula", name: "Paula M. Castro" },
      { id: "maria", name: "Maria J. Souto-Salorio" },
      { id: "ana", name: "Ana D. Tarrio-Tobar" },
      { id: "francisco", name: "Francisco J. Vazquez-Araujo" },
      // Add additional nodes for each unique collaborator or paper title.
    ],
    links: [
      { source: "adriana", target: "paula" },
      { source: "adriana", target: "maria" },
      { source: "adriana", target: "ana" },
      { source: "adriana", target: "francisco" },
      // Add links between Adriana and each co-author for every publication they collaborated on.
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeHover = (node) => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.style.cursor = node ? "pointer" : "default";
    }
  };

  useEffect(() => {
    const fg = forceGraphRef.current;
    if (fg) {
      fg.d3Force("link").distance(200);
      fg.zoomToFit(400, 50);
    }
  }, []);

  const bodyContent = (
    <div style={{ width: "100%", height: "650px" }}>
      <ForceGraph2D
        graphData={graphData}
        nodeAutoColorBy="id"
        linkDirectionalArrowLength={2}
        linkDirectionalArrowRelPos={20}
        nodeCanvasObject={(node, ctx) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color || "blue";
          ctx.fill();
          ctx.font = "5px Arial";
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.fillText(node.name, node.x, node.y - 10);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        onNodeHover={handleNodeHover}
      />
    </div>
  );

  return (
    <Modal
      disabled={loading}
      isOpen={networkModal.isOpen}
      title="Author's Paper Network"
      onClose={networkModal.onClose}
      body={bodyContent}
    />
  );
};

export default NetworkModal;
