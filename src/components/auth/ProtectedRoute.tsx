import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { authSession } from '../../services/api';

interface Props {
  roles: Array<'ADMIN' | 'STAFF'>;
  fallback: string;
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<Props> = ({ roles, fallback, children }) => {
  const { cafeSlug } = useParams();
  const session = authSession.get();
  if (!session || !roles.includes(session.role)) return <Navigate to={fallback} replace />;
  if (session.role === 'STAFF' && cafeSlug && session.cafeSlug !== cafeSlug) {
    return <Navigate to="/staff" replace />;
  }
  return children;
};
