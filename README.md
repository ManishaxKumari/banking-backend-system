# 📁 What problem does it solve?

<img width="1377" height="892" alt="image" src="https://github.com/user-attachments/assets/b7021a15-254f-48ef-bee4-be8b271d6382" />


# 📁 Folder Structure

<img width="646" height="792" alt="image" src="https://github.com/user-attachments/assets/b088cc47-c50d-4efd-913f-eaa4b25368fc" />

```text

backend-ledger/
│
├── server.js                  # Application entry point (loads env, connects DB, starts server)
├── package.json               # Project metadata, dependencies, and scripts
├── .gitignore                 # Prevents sensitive and unnecessary files from being committed
├── .env                       # Environment variables (not committed)
│
└── src/
    │
    ├── app.js                 # Configures Express app, global middleware, and routes
    │
    ├── config/
    │   └── db.js              # MongoDB connection configuration
    │
    ├── routes/
    │   ├── auth.routes.js         # Authentication API routes
    │   ├── account.routes.js      # Account management routes
    │   └── transaction.routes.js  # Transaction-related routes
    │
    ├── middleware/
    │   └── auth.middleware.js     # Authentication & authorization middleware
    │
    ├── controllers/
    │   ├── auth.controller.js         # User registration, login, logout
    │   ├── account.controller.js      # Account creation and balance retrieval
    │   └── transaction.controller.js  # Fund transfer and transaction processing
    │
    ├── models/
    │   ├── user.model.js         # User schema and password hashing
    │   ├── account.model.js      # Account schema and balance aggregation
    │   ├── transaction.model.js  # Transaction schema
    │   ├── ledger.model.js       # Immutable double-entry ledger records
    │   └── blacklist.model.js    # Blacklisted JWT tokens
    │
    └── services/
        └── email.service.js      # Email notifications (registration & transactions)
```

---

## 📂 Folder Responsibilities

| Folder | Responsibility |
|---------|----------------|
| **config/** | Stores application configuration and initializes external services such as the MongoDB connection. |
| **routes/** | Defines API endpoints and maps incoming requests to the appropriate controllers. |
| **middleware/** | Handles cross-cutting concerns like authentication, authorization, and request preprocessing. |
| **controllers/** | Processes HTTP requests, implements business logic, interacts with models/services, and returns responses. |
| **models/** | Defines MongoDB schemas, validation rules, indexes, and manages database operations. |
| **services/** | Contains reusable services and integrations with external systems such as email providers. |
| **app.js** | Creates the Express application, registers global middleware, and mounts all routes. |
| **server.js** | Bootstraps the application by loading environment variables, connecting to the database, and starting the HTTP server. |

## 📂 How balance is calculated?
<img width="1372" height="890" alt="image" src="https://github.com/user-attachments/assets/29efd9c4-469e-409f-8a5a-22460ac0370f" />

## 📂 Database schema
<img width="1326" height="782" alt="image" src="https://github.com/user-attachments/assets/9780c47e-b498-4c02-9d0d-567c12dc0831" />
