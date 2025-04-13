from django.urls import path
from .views import (
    BudgetListCreateView, BudgetDetailView, TransactionListCreateView,
    TransactionDetailView, TransactionCategoryListCreateView,
    TransactionCategoryDetailView, FamilyTransactionHistoryView,
    BudgetSummaryView, SavingsGoalListCreateView, SavingsGoalDetailView,
    SavingsContributionListCreateView, SavingsContributionDetailView,
    FamilyBudgetAnalyticsView, TransactionAnalyticsView, BudgetComparisonView
)

urlpatterns = [
    # Budget URLs
    path('', BudgetListCreateView.as_view(), name='budget-list-create'),
    path('<int:pk>/', BudgetDetailView.as_view(), name='budget-detail'),
    path('<int:budget_id>/summary/', BudgetSummaryView.as_view(), name='budget-summary'),
    
    # Transaction URLs
    path('transactions/', TransactionListCreateView.as_view(), name='transaction-list-create'),
    path('transactions/<int:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),
    path('families/<int:family_id>/transactions/', FamilyTransactionHistoryView.as_view(), name='family-transaction-history'),
    
    # Transaction Category URLs
    path('categories/', TransactionCategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', TransactionCategoryDetailView.as_view(), name='category-detail'),
    
    # Savings Goal URLs
    path('savings-goals/', SavingsGoalListCreateView.as_view(), name='savings-goal-list-create'),
    path('savings-goals/<int:pk>/', SavingsGoalDetailView.as_view(), name='savings-goal-detail'),
    
    # Savings Contribution URLs
    path('savings-contributions/', SavingsContributionListCreateView.as_view(), name='contribution-list-create'),
    path('savings-contributions/<int:pk>/', SavingsContributionDetailView.as_view(), name='contribution-detail'),
    
    # Analytics URLs
    path('families/<int:family_id>/analytics/budget/', FamilyBudgetAnalyticsView.as_view(), name='family-budget-analytics'),
    path('families/<int:family_id>/analytics/transactions/', TransactionAnalyticsView.as_view(), name='transaction-analytics'),
    path('families/<int:family_id>/analytics/comparison/', BudgetComparisonView.as_view(), name='budget-comparison'),
] 