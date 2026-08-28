# StokMate Assignment

## Context

Build two client applications that use the same provided .NET API:

- Web application for head-office product management
- Mobile application for store staff

The original assessment is intentionally small in scope.

Keep the implementation lean, focused, and production-minded.

Avoid unnecessary complexity, premature abstraction, and infrastructure that is not required by the assignment.

---

## Provided Backend

The provided .NET backend is located at:

`api/StokMate`

The backend:

- runs with `dotnet run`
- requires no separate database setup
- exposes Swagger
- may contain endpoints that are not required for this assignment

Test credentials:

```text
Email: test@ornek.com
Password: Test1234!

```

When inspecting API behavior, use the implementation under `api/StokMate`, the provided API documentation, and Swagger as the source of truth.

Do not invent API contracts.

The backend may be modified only if necessary.

---

# Web Application

## Required Stack

- React
- TypeScript

## Authentication

Implement:

- login screen
- token retrieval
- token persistence
- authenticated API requests
- redirect to login when the session becomes invalid

## Product List

Implement:

- product listing
- search
- category filtering
- brand filtering
- pagination

## Product Detail

Implement a product detail screen.

## Product Update

Allow users to update:

- name
- price
- stock
- status

After a successful update, the product list must display the latest product data.

## UI States

Handle:

- loading
- error
- empty states

## Optional Bonus

If a product is updated by another client while the web product list is open, the list should reflect the change within a reasonable amount of time.

The implementation approach is open.

---

# Mobile Application

## Required Stack

- React Native
- TypeScript

## Authentication

Implement a login screen.

## Product List

Implement:

- product listing
- search

Pagination is optional.

## Product Detail

Implement a product detail screen.

## Stock Update

Allow store staff to update product stock.

This is the primary mobile workflow.

## UI States

Handle:

- loading
- error
- empty states

## Android Delivery

Produce a working Android APK.

---

# General Requirements

UI/UX quality is part of the evaluation.

All non-mandatory technology choices are open, including:

- state management
- HTTP client
- routing
- form handling
- UI libraries
- Expo or bare React Native
- supporting development libraries

Choose libraries deliberately and keep the dependency set minimal.

Technology decisions must be explained in the final README.

---

# Delivery

Deliver:

- source code
- working Android APK
- README

The README must include:

- how to run the backend
- how to run the web application
- how to run the mobile application
- assumptions
- selected libraries and why they were chosen
- relevant limitations or implementation notes

---

# Scope Rules

Prioritize required functionality before optional work.

Do not introduce features that are not required unless they clearly improve the evaluation outcome.

Prefer simple solutions over complex ones when both satisfy the requirements.

Avoid unnecessary:

- global state
- custom frameworks
- design systems
- backend changes
- realtime infrastructure
- generic abstraction layers
- build infrastructure

Bonus requirements must not compromise required functionality.

---

# Handling Ambiguity

When a requirement or API behavior is unclear:

1. inspect `api/StokMate`, the API documentation, and Swagger first
2. make the smallest reasonable assumption if necessary
3. document important assumptions in the README

Do not silently invent behavior.
