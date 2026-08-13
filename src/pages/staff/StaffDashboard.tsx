import React from 'react';
import { useParams } from 'react-router-dom';
import { KanbanBoard } from './components/KanbanBoard';

export const StaffDashboard: React.FC = () => {
  const { cafeSlug = 'monastir-lounge' } = useParams<{ cafeSlug: string }>();
  return <KanbanBoard cafeSlug={cafeSlug} />;
};
