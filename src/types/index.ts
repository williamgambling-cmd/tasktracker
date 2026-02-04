import { Request } from 'express';
import { TokenPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface TaskFilterQuery extends PaginationQuery {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
