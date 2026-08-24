export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  taskId?: string;
  assigneeId?: string;
  priority?: "low" | "medium" | "high" | "critical";
  labels: string[];
  position: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  limit?: number;
  cards: KanbanCard[];
  position: number;
}

export interface KanbanBoard {
  id: string;
  name: string;
  projectId: string;
  columns: KanbanColumn[];
}

export interface KanbanMove {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  position: number;
}

export function moveKanbanCard(
  board: KanbanBoard,
  move: KanbanMove,
): KanbanBoard {
  const nextBoard: KanbanBoard = structuredClone(board);

  const source = nextBoard.columns.find(
    (column) => column.id === move.fromColumnId,
  );

  const target = nextBoard.columns.find(
    (column) => column.id === move.toColumnId,
  );

  if (!source || !target) return board;

  const cardIndex = source.cards.findIndex(
    (card) => card.id === move.cardId,
  );

  if (cardIndex === -1) return board;

  const [card] = source.cards.splice(cardIndex, 1);

  card.position = move.position;

  target.cards.splice(move.position, 0, card);

  target.cards.forEach((item, index) => {
    item.position = index;
  });

  source.cards.forEach((item, index) => {
    item.position = index;
  });

  return nextBoard;
}