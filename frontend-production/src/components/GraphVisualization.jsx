import React from "react";
import { GraphCanvas } from "reagraph";

const GraphVisualization = () => {
  // Define graph data
  const graphData = {
    nodes: [
      {
        id: "1",
        label: "Adriana",
        fill: "#4a90e2",
      },
      {
        id: "2",
        label: "Ben",
        fill: "#4a90e2",
      },
    ],
    edges: [
      {
        id: "1->2",
        source: "1",
        target: "2",
        label: "",
        fill: "#848484",
      },
    ],
  };

  return (
    <div
      style={{
        width: "100%",
        height: "300px", // Explicit height for consistent rendering
        maxWidth: "600px",
        maxHeight: "400px",
        margin: "0 auto",
        overflow: "hidden",
      }}
    >
      <GraphCanvas
        nodes={graphData.nodes}
        edges={graphData.edges}
        layoutType="forceDirected2d"
        labelType="all"
        animated
        style={{
          width: "100%",
          height: "100%",
          background: "#ffffff",
        }}
      />
    </div>
  );
};

export default GraphVisualization;
