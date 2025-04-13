from django.db import models
from django.conf import settings
from families.models import Family


class Budget(models.Model):
    PERIOD_CHOICES = (
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )
    
    TYPE_CHOICES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )
    
    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name='budgets'
    )
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    budget_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_budgets'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.get_budget_type_display()} ({self.family.name})"


class TransactionCategory(models.Model):
    TYPE_CHOICES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )
    
    name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name='transaction_categories'
    )
    
    class Meta:
        verbose_name_plural = 'Transaction Categories'
        unique_together = ('name', 'family', 'category_type')
    
    def __str__(self):
        return f"{self.name} ({self.get_category_type_display()})"


class Transaction(models.Model):
    budget = models.ForeignKey(
        Budget,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.amount} - {self.budget.name} ({self.date})"


class SavingsGoal(models.Model):
    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name='savings_goals'
    )
    name = models.CharField(max_length=100)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    target_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_savings_goals'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.current_amount}/{self.target_amount} ({self.family.name})"


class SavingsContribution(models.Model):
    savings_goal = models.ForeignKey(
        SavingsGoal,
        on_delete=models.CASCADE,
        related_name='contributions'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='savings_contributions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.amount} to {self.savings_goal.name} ({self.date})"
