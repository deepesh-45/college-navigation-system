import { NAV_NODES, NAV_EDGES, BUILDINGS, ROOMS, FACILITIES } from '../data/campusData';
import { NavNode, RouteResult, Building, Room, Facility } from '../types';

// Calculate Euclidean distance between two nodes (used as heuristic for A*)
function getHeuristic(nodeA: NavNode, nodeB: NavNode): number {
  const dx = nodeA.x - nodeB.x;
  const dy = nodeA.y - nodeB.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// A* Routing Algorithm
export function findRoute(startNodeId: string, targetEntityId: string): RouteResult | null {
  const startNode = NAV_NODES.find(n => n.id === startNodeId);
  if (!startNode) return null;

  // Resolve target entity to node
  let targetNodeId: string | null = null;
  let targetEntity: Building | Room | Facility | null = null;

  // Check if target is a building
  const building = BUILDINGS.find(b => b.id === targetEntityId);
  if (building) {
    targetEntity = building;
    const entranceNode = NAV_NODES.find(n => n.buildingId === building.id && (n.type === 'entrance' || n.type === 'destination'));
    if (entranceNode) targetNodeId = entranceNode.id;
  }

  // Check if target is a room
  if (!targetNodeId) {
    const room = ROOMS.find(r => r.id === targetEntityId);
    if (room) {
      targetEntity = room;
      targetNodeId = room.nodeId;
    }
  }

  // Check if target is a facility
  if (!targetNodeId) {
    const facility = FACILITIES.find(f => f.id === targetEntityId);
    if (facility) {
      targetEntity = facility;
      targetNodeId = facility.nodeId;
    }
  }

  // Check direct node ID match
  if (!targetNodeId) {
    const directNode = NAV_NODES.find(n => n.id === targetEntityId);
    if (directNode) targetNodeId = directNode.id;
  }

  if (!targetNodeId) return null;
  const targetNode = NAV_NODES.find(n => n.id === targetNodeId);
  if (!targetNode) return null;

  // A* Search
  const openSet = new Set<string>([startNode.id]);
  const cameFrom = new Map<string, string>();

  const gScore = new Map<string, number>();
  NAV_NODES.forEach(n => gScore.set(n.id, Infinity));
  gScore.set(startNode.id, 0);

  const fScore = new Map<string, number>();
  NAV_NODES.forEach(n => fScore.set(n.id, Infinity));
  fScore.set(startNode.id, getHeuristic(startNode, targetNode));

  while (openSet.size > 0) {
    // Find node in openSet with lowest fScore
    let currentId: string | null = null;
    let lowestF = Infinity;
    openSet.forEach(id => {
      const score = fScore.get(id) || Infinity;
      if (score < lowestF) {
        lowestF = score;
        currentId = id;
      }
    });

    if (!currentId) break;

    if (currentId === targetNodeId) {
      // Reconstruct path
      const pathNodes: NavNode[] = [];
      let temp: string | undefined = currentId;
      while (temp) {
        const nodeObj = NAV_NODES.find(n => n.id === temp);
        if (nodeObj) pathNodes.unshift(nodeObj);
        temp = cameFrom.get(temp);
      }

      // Calculate total distance & instructions
      let totalDist = 0;
      const instructions: string[] = [];

      for (let i = 0; i < pathNodes.length - 1; i++) {
        const curr = pathNodes[i];
        const next = pathNodes[i + 1];
        const edge = NAV_EDGES.find(
          e => (e.from === curr.id && e.to === next.id) || (e.from === next.id && e.to === curr.id)
        );
        const dist = edge ? edge.distance : Math.round(getHeuristic(curr, next) * 0.5);
        totalDist += dist;

        if (i === 0) {
          instructions.push(`Head straight from ${curr.name || 'Kiosk'} toward ${next.name}.`);
        } else if (next.type === 'staircase' || next.type === 'elevator') {
          instructions.push(`Take the ${next.type} at ${next.name} to Floor ${next.floorNumber}.`);
        } else {
          instructions.push(`Continue to ${next.name} (${dist}m).`);
        }
      }

      if (targetEntity) {
        instructions.push(`Arrive at ${'name' in targetEntity ? targetEntity.name : 'destination'}.`);
      }

      const estimatedMinutes = Math.max(1, Math.round(totalDist / 60)); // ~1m/s walking speed

      return {
        nodes: pathNodes,
        pathIds: pathNodes.map(n => n.id),
        totalDistance: totalDist,
        estimatedMinutes,
        instructions,
        destination: targetEntity || {
          id: targetNode.id,
          name: targetNode.name || 'Destination Node',
          shortName: targetNode.name || 'Node',
          category: 'facility',
          floors: 1,
          description: 'Navigation Node',
          x: targetNode.x,
          y: targetNode.y,
          width: 0,
          height: 0,
          color: '#ffffff'
        },
        startNode
      };
    }

    openSet.delete(currentId);
    const currNodeObj = NAV_NODES.find(n => n.id === currentId);
    if (!currNodeObj) continue;

    // Get neighbors
    const connectedEdges = NAV_EDGES.filter(e => e.from === currentId || e.to === currentId);

    for (const edge of connectedEdges) {
      const neighborId = edge.from === currentId ? edge.to : edge.from;
      const neighborNode = NAV_NODES.find(n => n.id === neighborId);
      if (!neighborNode) continue;

      const tentativeG = (gScore.get(currentId) || Infinity) + edge.distance;
      if (tentativeG < (gScore.get(neighborId) || Infinity)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeG);
        fScore.set(neighborId, tentativeG + getHeuristic(neighborNode, targetNode));
        openSet.add(neighborId);
      }
    }
  }

  return null;
}
