export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  family?: string | null;
  sortOrder?: number;
  status?: CategoryStatus;
  createdBy?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  family?: string | null;
  sortOrder?: number;
  status?: CategoryStatus;
  updatedBy?: string;
}

export interface ChangeStatusPayload {
  status: CategoryStatus;
}

export interface CategoryQueryParams {
  search?: string;
  family?: string;
  familySlug?: string;
  status?: string;
  sort?: string;
  page?: number | string;
  limit?: number | string;
}

