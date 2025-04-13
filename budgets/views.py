from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncMonth, TruncYear, TruncWeek
from django.utils import timezone
from datetime import timedelta
from families.models import Family, FamilyMembership
from .models import (
    Budget, Transaction, TransactionCategory,
    SavingsGoal, SavingsContribution
)
from .serializers import (
    BudgetSerializer, TransactionSerializer, TransactionCategorySerializer,
    SavingsGoalSerializer, SavingsContributionSerializer
)


class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    
    def get_queryset(self):
        # Filter by family if provided
        family_id = self.request.query_params.get('family')
        queryset = Budget.objects.filter(
            family__memberships__user=self.request.user,
            family__memberships__status='accepted'
        ).distinct()
        
        if family_id:
            queryset = queryset.filter(family_id=family_id)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Serialize the queryset
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        # Add spent_amount to each budget
        for budget_data in data:
            budget_id = budget_data['id']
            budget_type = budget_data['budget_type']

            spent_amount = Transaction.objects.filter(
                budget_id=budget_id
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Add spent_amount to the budget data
            budget_data['spent_amount'] = spent_amount
        
        return Response(data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        data = serializer.data
        data['spent_amount'] = 0
        return Response(data, status=status.HTTP_201_CREATED)



class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    
    def get_queryset(self):
        return Budget.objects.filter(
            family__memberships__user=self.request.user,
            family__memberships__status='accepted'
        )

    def retrieve(self, request, *args, **kwargs):
        # Получаем один объект, а не queryset
        instance = self.get_object()
        
        # Сериализуем объект
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Добавляем spent_amount к бюджету
        budget_id = data['id']
        spent_amount = Transaction.objects.filter(
            budget_id=budget_id
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        data['spent_amount'] = spent_amount
        
        return Response(data)

    def update(self, request, *args, **kwargs):
        # Получаем один объект, а не queryset
        instance = self.get_object()
        
        # Сериализуем объект
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Добавляем spent_amount к бюджету
        data = serializer.data
        budget_id = data['id']
        spent_amount = Transaction.objects.filter(
            budget_id=budget_id
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        data['spent_amount'] = spent_amount
        
        return Response(data)

class TransactionCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionCategorySerializer
    
    def get_queryset(self):
        # Filter by family if provided
        family_id = self.request.query_params.get('family_id')
        queryset = TransactionCategory.objects.filter(
            family__memberships__user=self.request.user,
            family__memberships__status='accepted'
        ).distinct()
        
        if family_id:
            queryset = queryset.filter(family_id=family_id)
        
        return queryset


class TransactionCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionCategorySerializer
    
    def get_queryset(self):
        return TransactionCategory.objects.filter(
            family__memberships__user=self.request.user,
            family__memberships__status='accepted'
        )


class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    
    def get_queryset(self):
        # Filter by budget if provided
        budget_id = self.request.query_params.get('budget_id')
        queryset = Transaction.objects.filter(
            budget__family__memberships__user=self.request.user,
            budget__family__memberships__status='accepted'
        ).distinct()
        
        if budget_id:
            queryset = queryset.filter(budget_id=budget_id)
        
        return queryset


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    
    def get_queryset(self):
        return Transaction.objects.filter(
            budget__family__memberships__user=self.request.user,
            budget__family__memberships__status='accepted'
        )


class FamilyTransactionHistoryView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    
    def get_queryset(self):
        family_id = self.kwargs.get('family_id')
        # Check if user is a member of the family
        get_object_or_404(
            FamilyMembership,
            family_id=family_id,
            user=self.request.user,
            status='accepted'
        )
        
        return Transaction.objects.filter(
            budget__family_id=family_id
        ).order_by('-date', '-created_at')


class BudgetSummaryView(APIView):
    def get(self, request, budget_id):
        # Check if user has access to the budget
        budget = get_object_or_404(
            Budget,
            id=budget_id,
            family__memberships__user=request.user,
            family__memberships__status='accepted'
        )
        
        # Calculate total transactions
        total_transactions = Transaction.objects.filter(
            budget=budget
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate remaining amount
        if budget.budget_type == 'income':
            remaining = total_transactions - budget.amount
        else:  # expense
            remaining = budget.amount - total_transactions
        
        return Response({
            'budget': BudgetSerializer(budget, context={'request': request}).data,
            'total_transactions': total_transactions,
            'remaining': remaining
        })


class SavingsGoalListCreateView(generics.ListCreateAPIView):
    serializer_class = SavingsGoalSerializer
    
    def get_queryset(self):
        # Filter by family if provided
        family_id = self.request.query_params.get('family_id')
        queryset = SavingsGoal.objects.filter(
            family__memberships__user=self.request.user,
            family__memberships__status='accepted'
        ).distinct()
        
        if family_id:
            queryset = queryset.filter(family_id=family_id)
        
        return queryset


class SavingsGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SavingsGoalSerializer
    
    def get_queryset(self):
        return SavingsGoal.objects.filter(
            family__memberships__user=self.request.user,
            family__memberships__status='accepted'
        )


class SavingsContributionListCreateView(generics.ListCreateAPIView):
    serializer_class = SavingsContributionSerializer
    
    def get_queryset(self):
        # Filter by savings goal if provided
        savings_goal_id = self.request.query_params.get('savings_goal_id')
        queryset = SavingsContribution.objects.filter(
            savings_goal__family__memberships__user=self.request.user,
            savings_goal__family__memberships__status='accepted'
        ).distinct()
        
        if savings_goal_id:
            queryset = queryset.filter(savings_goal_id=savings_goal_id)
        
        return queryset


class SavingsContributionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SavingsContributionSerializer
    
    def get_queryset(self):
        return SavingsContribution.objects.filter(
            savings_goal__family__memberships__user=self.request.user,
            savings_goal__family__memberships__status='accepted'
        )
    
    def perform_destroy(self, instance):
        # Update the current amount in the savings goal
        savings_goal = instance.savings_goal
        savings_goal.current_amount -= instance.amount
        savings_goal.save()
        
        instance.delete()


class FamilyBudgetAnalyticsView(APIView):
    def get(self, request, family_id):
        # Check if user is a member of the family
        get_object_or_404(
            FamilyMembership,
            family_id=family_id,
            user=request.user,
            status='accepted'
        )
        
        # Get all budgets for the family
        budgets = Budget.objects.filter(family_id=family_id)
        
        # Calculate total budget amounts by type
        budget_totals = budgets.values('budget_type').annotate(
            total=Sum('amount')
        )
        
        # Calculate total transactions by budget type
        transaction_totals = Transaction.objects.filter(
            budget__family_id=family_id
        ).values('budget__budget_type').annotate(
            total=Sum('amount')
        )
        
        # Calculate budget utilization
        budget_utilization = {}
        for budget_type in ['income', 'expense']:
            budget_amount = next((item['total'] for item in budget_totals if item['budget_type'] == budget_type), 0)
            transaction_amount = next((item['total'] for item in transaction_totals if item['budget__budget_type'] == budget_type), 0)
            
            if budget_amount > 0:
                utilization = (transaction_amount / budget_amount) * 100
            else:
                utilization = 0
                
            budget_utilization[budget_type] = {
                'budget_amount': budget_amount,
                'transaction_amount': transaction_amount,
                'utilization_percentage': utilization
            }
        
        # Get savings goals progress
        savings_goals = SavingsGoal.objects.filter(family_id=family_id)
        savings_progress = []
        
        for goal in savings_goals:
            if goal.target_amount > 0:
                progress_percentage = (goal.current_amount / goal.target_amount) * 100
            else:
                progress_percentage = 0
                
            savings_progress.append({
                'goal_id': goal.id,
                'name': goal.name,
                'target_amount': goal.target_amount,
                'current_amount': goal.current_amount,
                'progress_percentage': progress_percentage,
                'target_date': goal.target_date
            })
        
        return Response({
            'budget_utilization': budget_utilization,
            'savings_progress': savings_progress
        })


class TransactionAnalyticsView(APIView):
    def get(self, request, family_id):
        # Check if user is a member of the family
        get_object_or_404(
            FamilyMembership,
            family_id=family_id,
            user=request.user,
            status='accepted'
        )
        
        # Get query parameters
        period = request.query_params.get('period', 'month')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Filter transactions by date if provided
        transactions = Transaction.objects.filter(budget__family_id=family_id)
        
        if start_date:
            transactions = transactions.filter(date__gte=start_date)
        
        if end_date:
            transactions = transactions.filter(date__lte=end_date)
        
        # Group transactions by category
        category_totals = transactions.values(
            'category__name', 'category__category_type'
        ).annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        # Group transactions by time period
        if period == 'week':
            time_function = TruncWeek('date')
        elif period == 'month':
            time_function = TruncMonth('date')
        elif period == 'year':
            time_function = TruncYear('date')
        else:
            time_function = TruncMonth('date')  # Default to month
        
        time_series = transactions.annotate(
            period=time_function
        ).values(
            'period', 'budget__budget_type'
        ).annotate(
            total=Sum('amount')
        ).order_by('period')
        
        # Calculate spending trends
        spending_trends = []
        for entry in time_series:
            spending_trends.append({
                'period': entry['period'],
                'budget_type': entry['budget__budget_type'],
                'amount': entry['total']
            })
        
        # Get top spending categories
        top_expense_categories = [item for item in category_totals if item.get('category__category_type') == 'expense'][:5]
        top_income_categories = [item for item in category_totals if item.get('category__category_type') == 'income'][:5]
        
        return Response({
            'top_expense_categories': top_expense_categories,
            'top_income_categories': top_income_categories,
            'spending_trends': spending_trends
        })


class BudgetComparisonView(APIView):
    def get(self, request, family_id):
        # Check if user is a member of the family
        get_object_or_404(
            FamilyMembership,
            family_id=family_id,
            user=request.user,
            status='accepted'
        )
        
        # Get all budgets for the family
        budgets = Budget.objects.filter(family_id=family_id)
        
        # Compare income vs expense budgets
        income_budgets = budgets.filter(budget_type='income').aggregate(total=Sum('amount'))['total'] or 0
        expense_budgets = budgets.filter(budget_type='expense').aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate net budget (income - expense)
        net_budget = income_budgets - expense_budgets
        
        # Compare actual income vs expense transactions
        income_transactions = Transaction.objects.filter(
            budget__family_id=family_id,
            budget__budget_type='income'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        expense_transactions = Transaction.objects.filter(
            budget__family_id=family_id,
            budget__budget_type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate net transactions (income - expense)
        net_transactions = income_transactions - expense_transactions
        
        # Calculate budget vs actual difference
        budget_vs_actual = {
            'income': {
                'budget': income_budgets,
                'actual': income_transactions,
                'difference': income_transactions - income_budgets,
                'percentage': (income_transactions / income_budgets * 100) if income_budgets > 0 else 0
            },
            'expense': {
                'budget': expense_budgets,
                'actual': expense_transactions,
                'difference': expense_transactions - expense_budgets,
                'percentage': (expense_transactions / expense_budgets * 100) if expense_budgets > 0 else 0
            },
            'net': {
                'budget': net_budget,
                'actual': net_transactions,
                'difference': net_transactions - net_budget,
                'percentage': (net_transactions / net_budget * 100) if net_budget > 0 else 0
            }
        }
        
        return Response(budget_vs_actual)
