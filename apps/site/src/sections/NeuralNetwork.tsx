import { useRef } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  color?: string;
  percentage?: string;
  isOutput?: boolean;
}

const inputNodes: Node[] = [
  { id: 'tok', x: 50, y: 80, label: 'tok' },
  { id: 'pos', x: 50, y: 160, label: 'pos' },
  { id: 'emb', x: 50, y: 240, label: 'emb' },
];

const layerNodes: Node[] = [
  { id: 'L0', x: 180, y: 60, label: 'L0' },
  { id: 'L1', x: 180, y: 130, label: 'L1' },
  { id: 'L2', x: 180, y: 200, label: 'L2' },
  { id: 'L3', x: 180, y: 270, label: 'L3' },
  { id: 'L4', x: 320, y: 60, label: 'L4' },
  { id: 'L5', x: 320, y: 130, label: 'L5' },
  { id: 'L6', x: 320, y: 200, label: 'L6' },
  // Opaque fills (old rgba saw edges through the circle). Colors ≈ old tint on #faf9f5.
  { id: 'L7', x: 320, y: 270, label: 'L7', color: '#e9c5b6', percentage: '23%' },
  { id: 'L8', x: 460, y: 60, label: 'L8', color: '#e4b6a4', percentage: '49%' },
  { id: 'L9', x: 460, y: 130, label: 'L9', color: '#eecbbe', percentage: '65%' },
  { id: 'L10', x: 460, y: 200, label: 'L10', color: '#e6bdad', percentage: '52%' },
  { id: 'L11', x: 460, y: 270, label: 'L11', color: '#eecbbe', percentage: '48%' },
  { id: 'L12', x: 600, y: 60, label: 'L12', color: '#e9c5b6', percentage: '21%' },
  { id: 'L13', x: 600, y: 130, label: 'L13' },
  { id: 'L14', x: 600, y: 200, label: 'L14' },
  { id: 'L15', x: 600, y: 270, label: 'L15' },
];

const outputNode: Node = { id: 'out', x: 730, y: 160, label: 'out', color: '#5c6b54', isOutput: true };

export default function NeuralNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);

  const allNodes = [...inputNodes, ...layerNodes, outputNode];

  const getConnections = () => {
    const connections: { from: Node; to: Node }[] = [];
    inputNodes.forEach((input) => {
      layerNodes.slice(0, 4).forEach((layer) => {
        connections.push({ from: input, to: layer });
      });
    });
    for (let col = 0; col < 3; col++) {
      const fromStart = col * 4;
      const toStart = (col + 1) * 4;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          connections.push({
            from: layerNodes[fromStart + i],
            to: layerNodes[toStart + j],
          });
        }
      }
    }
    layerNodes.slice(12, 16).forEach((layer) => {
      connections.push({ from: layer, to: outputNode });
    });
    return connections;
  };

  const connections = getConnections();

  return (
    <div className="flex justify-center py-8 bg-background">
      <svg
        ref={svgRef}
        viewBox="0 0 800 340"
        className="w-full max-w-4xl"
        style={{ overflow: 'visible' }}
      >
        {connections.map((conn, i) => (
          <line
            key={i}
            x1={conn.from.x + 20}
            y1={conn.from.y + 20}
            x2={conn.to.x + 20}
            y2={conn.to.y + 20}
            stroke="#d1cfc5"
            strokeWidth="1"
            opacity="0.9"
          />
        ))}

        {allNodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x + 20}
              cy={node.y + 20}
              r={node.isOutput ? 24 : 20}
              fill={node.color || (inputNodes.includes(node) ? '#30302e' : '#faf9f5')}
              stroke={node.color ? '#d4a090' : '#e8e6dc'}
              strokeWidth="1"
            />
            <text
              x={node.x + 20}
              y={node.y + 20}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-mono"
              fill={
                node.isOutput
                  ? '#faf9f5'
                  : inputNodes.includes(node)
                    ? '#faf9f5'
                    : node.color
                      ? '#141413'
                      : '#5e5d59'
              }
              fontSize="11"
            >
              {node.label}
            </text>
            {node.percentage && (
              <text
                x={node.x + 20}
                y={node.y - 8}
                textAnchor="middle"
                className="text-xs font-mono"
                fill="#87867f"
                fontSize="10"
              >
                {node.percentage}
              </text>
            )}
          </g>
        ))}

        <text
          x={outputNode.x + 54}
          y={outputNode.y + 20}
          textAnchor="start"
          dominantBaseline="central"
          className="text-sm font-mono"
          fill="#5e5d59"
          fontSize="12"
        >
          artifact
        </text>
      </svg>
    </div>
  );
}
