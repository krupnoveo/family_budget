# Family Budget Planning Application

A Django REST API application for family budget planning. This application allows users to create families, invite members, manage budgets, track transactions, and set savings goals.

## Features

- User registration and authentication with JWT tokens
- Family creation and member management
- Budget planning for different periods (weekly, monthly, yearly)
- Transaction tracking with categories
- Savings goals and contributions
- Family transaction history
- Budget and transaction analytics
- Ability to leave families and promote members to admin

## Technology Stack

- Django 5.1
- Django REST Framework
- SQLite (can be configured to use PostgreSQL)
- JWT Authentication

## Setup Instructions

### Prerequisites

- Python 3.8+
- (Optional) PostgreSQL if you want to use it instead of SQLite

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd family_budget_2
```

2. Create and activate a virtual environment:
```
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```
pip install -r requirements.txt
```

4. The project is configured to use SQLite by default. If you want to use PostgreSQL, update the database settings in `family_budget_2/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'family_budget',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

5. Run migrations:
```
python manage.py makemigrations
python manage.py migrate
```

6. Create a superuser:
```
python manage.py createsuperuser
```

7. Run the development server:
```
python manage.py runserver
```

## API Endpoints

### Authentication

- `POST /api/users/register/` - Register a new user
- `POST /api/users/token/` - Get JWT token
- `POST /api/users/token/refresh/` - Refresh JWT token
- `GET /api/users/profile/` - Get user profile
- `PUT /api/users/profile/` - Update user profile
- `POST /api/users/change-password/` - Change password

### Families

- `GET /api/families/` - List user's families
- `POST /api/families/` - Create a new family
- `GET /api/families/<id>/` - Get family details
- `PUT /api/families/<id>/` - Update family
- `DELETE /api/families/<id>/` - Delete family (only creator can delete)
- `GET /api/families/<id>/members/` - List family members
- `POST /api/families/<id>/invite/` - Invite a user to family
- `DELETE /api/families/<id>/members/<id>/` - Remove a member from family
- `POST /api/families/<id>/members/<id>/promote/` - Promote a member to admin
- `DELETE /api/families/<id>/leave/` - Leave a family (if creator leaves and no other members, family is deleted)
- `GET /api/families/invitations/` - List user's invitations
- `POST /api/families/invitations/<id>/respond/` - Respond to invitation

### Budgets

- `GET /api/budgets/` - List budgets
- `POST /api/budgets/` - Create a new budget
- `GET /api/budgets/<id>/` - Get budget details
- `PUT /api/budgets/<id>/` - Update budget
- `DELETE /api/budgets/<id>/` - Delete budget
- `GET /api/budgets/<id>/summary/` - Get budget summary

### Transactions

- `GET /api/budgets/transactions/` - List transactions
- `POST /api/budgets/transactions/` - Create a new transaction
- `GET /api/budgets/transactions/<id>/` - Get transaction details
- `PUT /api/budgets/transactions/<id>/` - Update transaction
- `DELETE /api/budgets/transactions/<id>/` - Delete transaction
- `GET /api/budgets/families/<id>/transactions/` - Get family transaction history

### Transaction Categories

- `GET /api/budgets/categories/` - List categories
- `POST /api/budgets/categories/` - Create a new category
- `GET /api/budgets/categories/<id>/` - Get category details
- `PUT /api/budgets/categories/<id>/` - Update category
- `DELETE /api/budgets/categories/<id>/` - Delete category

### Savings Goals

- `GET /api/budgets/savings-goals/` - List savings goals
- `POST /api/budgets/savings-goals/` - Create a new savings goal
- `GET /api/budgets/savings-goals/<id>/` - Get savings goal details
- `PUT /api/budgets/savings-goals/<id>/` - Update savings goal
- `DELETE /api/budgets/savings-goals/<id>/` - Delete savings goal

### Savings Contributions

- `GET /api/budgets/contributions/` - List contributions
- `POST /api/budgets/contributions/` - Create a new contribution
- `GET /api/budgets/contributions/<id>/` - Get contribution details
- `PUT /api/budgets/contributions/<id>/` - Update contribution
- `DELETE /api/budgets/contributions/<id>/` - Delete contribution

### Analytics

- `GET /api/budgets/families/<id>/analytics/budget/` - Get budget analytics for a family
- `GET /api/budgets/families/<id>/analytics/transactions/` - Get transaction analytics for a family
- `GET /api/budgets/families/<id>/analytics/comparison/` - Get budget vs actual comparison for a family 