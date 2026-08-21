export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentCategory?: string;
  family?: string;
  sortOrder?: number;
  createdBy?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  parentCategory?: string | null;
  family?: string;
  sortOrder?: number;
  updatedBy?: string;
}

export interface ChangeStatusPayload {
  status: CategoryStatus;
}
