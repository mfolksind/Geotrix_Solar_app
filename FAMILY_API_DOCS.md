# Family Feature API Documentation

This document covers the new HTTP APIs introduced to support the **Family Architecture**, **Admin Approval Workflow**, and **Family-Scoped Products**.

## 1. Family Management Endpoints

The `families` endpoints are standard CRUD operations managed by admins. (Assuming a generic standard module layout mapped under `/api/families`)

### Create a Family
Creates a new family instance. `requiresAdminApproval` determines if users joining this family are held pending admin review.
- **URL**: `/api/families`
- **Method**: `POST`
- **Auth Required**: `Bearer Token` (Roles: `admin`, `super_admin`)
- **Body**:
  ```json
  {
    "name": "Geotrix",
    "description": "Premium industrial grade tools",
    "requiresAdminApproval": true,
    "status": "ACTIVE"
  }
  ```
- **Response**: `201 Created`

### List Families
- **URL**: `/api/families`
- **Method**: `GET`
- **Response**: `200 OK` (Array of Family objects)

---

## 2. User & Auth Updates

### User Registration
When a user signs up, they can optionally specify a `family`. If that family requires admin approval, their returned `status` will be `inactive` and `familyApprovalStatus` will be `pending`.
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "family": "603d3f9f...", // Optional: Family ObjectId
    "familySlug": "geotrix", // Optional: Family Slug (used instead of family ID)
    "source": "website" // Optional: Determines approval bypass logic
  }
  ```
  *Note: If `source` is set to `"website"`, the user automatically inherits the requested family without requiring admin approval (their status is set to `active`). If the source is an app or missing, the standard admin approval flow is used.*

### User Profile Update (Switching Families)
Users can update their family in their profile. If they switch to a family that requires approval *and* they haven't been previously approved for it, they will be placed in a `pending` state.
- **URL**: `/api/users/me`
- **Method**: `PUT`
- **Auth Required**: `Bearer Token`
- **Body**:
  ```json
  {
    "family": "603d3f9f..." 
  }
  ```

### Admin Approve/Reject Family Request
Admins use this endpoint to approve or reject a user's pending family request. Approving automatically adds the family to the user's `approvedFamilies` array and sends them an email.
- **URL**: `/api/users/:id/family-approval`
- **Method**: `PATCH`
- **Auth Required**: `Bearer Token` (Roles: `admin`, `super_admin`)
- **Body**:
  ```json
  {
    "status": "approved" // or "rejected"
  }
  ```
- **Response**: `200 OK`

---

## 3. Product & Category Overrides

### Create Category (Under a Family)
Categories now require or optionally accept a `family` ID to bind them.
- **URL**: `/api/categories`
- **Method**: `POST`
- **Auth Required**: `Bearer Token` (Roles: `admin`)
- **Body**:
  ```json
  {
    "name": "Drills",
    "family": "603d3f9f..."
  }
  ```

### Fetch Categories (Public/Filtered)
Categories can be fetched dynamically based on their associated family by passing a `familySlug`.
- **URL**: `/api/categories?familySlug=geotrix`
- **Method**: `GET`
- **Response**: `200 OK` (Only categories mapped to the requested family slug)

### Create Product
Products are now bound strictly to a `category` and a `family` (replaces the old `brand` string). 
- **URL**: `/api/products`
- **Method**: `POST`
- **Auth Required**: `Bearer Token` (Roles: `admin`)
- **Body**:
  ```json
  {
    "name": "Geotrix Impact Drill v2",
    "family": "603d3f9f...",
    "category": "503c1b2f..."
  }
  ```

### Fetch Products (Auto-Filtered)
When a regular `customer` fetches the list of products, the backend automatically restricts the query to the `family` they are currently assigned to (and approved for). Admins/sellers bypass this restriction.
Public storefronts (like Geotrix or Thermox) can also enforce product isolation by explicitly passing a `familySlug`.

- **URL**: `/api/products?page=1&limit=20&familySlug=geotrix`
- **Method**: `GET`
- **Auth Required**: Optional
- **Response**: `200 OK` (Only products matching the logged-in user's family or the provided `familySlug`)
