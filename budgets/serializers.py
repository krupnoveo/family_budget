from rest_framework import serializers
from .models import Budget, Transaction, TransactionCategory, SavingsGoal, SavingsContribution
from users.serializers import UserSerializer
from families.serializers import FamilySerializer
from families.models import Family


class TransactionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionCategory
        fields = ['id', 'name', 'category_type', 'family']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        # Ensure the user is a member of the family
        user = self.context['request'].user
        family = validated_data.get('family')
        
        if not family.memberships.filter(user=user, status='accepted').exists():
            raise serializers.ValidationError("You are not a member of this family.")
        
        return super().create(validated_data)


class BudgetSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    family = FamilySerializer(read_only=True)
    family_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        source='family',
        queryset=Family.objects.all()
    )
    
    class Meta:
        model = Budget
        fields = [
            'id', 'family', 'family_id', 'name', 'amount', 'budget_type',
            'period', 'start_date', 'end_date', 'created_by', 'created_at', 'description'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context.get('request').user if self.context.get('request') else None
        
        if user:
            # Filter families to only those the user is a member of
            self.fields['family_id'].queryset = Family.objects.filter(
                memberships__user=user,
                memberships__status='accepted'
            )
    
    def create(self, validated_data):
        user = self.context['request'].user
        return Budget.objects.create(created_by=user, **validated_data)


class TransactionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    budget = BudgetSerializer(read_only=True)
    budget_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        source='budget',
        queryset=Budget.objects.all()
    )
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'budget', 'budget_id', 'amount',
            'description', 'date', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context.get('request').user if self.context.get('request') else None
        
        if user:
            # Filter budgets to only those in families the user is a member of
            families = Family.objects.filter(
                memberships__user=user,
                memberships__status='accepted'
            )
            self.fields['budget_id'].queryset = Budget.objects.filter(family__in=families)
    
    def create(self, validated_data):
        user = self.context['request'].user
        return Transaction.objects.create(created_by=user, **validated_data)


class SavingsGoalSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    family = FamilySerializer(read_only=True)
    family_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        source='family',
        queryset=Family.objects.all()
    )
    
    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'family', 'family_id', 'name', 'target_amount', 'current_amount',
            'target_date', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'current_amount']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context.get('request').user if self.context.get('request') else None
        
        if user:
            # Filter families to only those the user is a member of
            self.fields['family_id'].queryset = Family.objects.filter(
                memberships__user=user,
                memberships__status='accepted'
            )
    
    def create(self, validated_data):
        user = self.context['request'].user
        return SavingsGoal.objects.create(created_by=user, **validated_data)


class SavingsContributionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    savings_goal = SavingsGoalSerializer(read_only=True)
    savings_goal_id = serializers.PrimaryKeyRelatedField(
        write_only=True,
        source='savings_goal',
        queryset=SavingsGoal.objects.all()
    )
    
    class Meta:
        model = SavingsContribution
        fields = [
            'id', 'savings_goal', 'savings_goal_id', 'amount', 'date',
            'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context.get('request').user if self.context.get('request') else None
        
        if user:
            # Filter savings goals to only those in families the user is a member of
            families = Family.objects.filter(
                memberships__user=user,
                memberships__status='accepted'
            )
            self.fields['savings_goal_id'].queryset = SavingsGoal.objects.filter(family__in=families)
    
    def create(self, validated_data):
        user = self.context['request'].user
        contribution = SavingsContribution.objects.create(created_by=user, **validated_data)
        
        # Update the current amount in the savings goal
        savings_goal = contribution.savings_goal
        savings_goal.current_amount += contribution.amount
        savings_goal.save()
        
        return contribution 