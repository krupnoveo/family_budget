# Generated by Django 5.1.7 on 2025-03-16 16:44

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('families', '__first__'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Budget',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('budget_type', models.CharField(choices=[('income', 'Income'), ('expense', 'Expense')], max_length=20)),
                ('period', models.CharField(choices=[('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly')], max_length=20)),
                ('description', models.TextField(blank=True, null=True)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_budgets', to=settings.AUTH_USER_MODEL)),
                ('family', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='budgets', to='families.family')),
            ],
        ),
        migrations.CreateModel(
            name='SavingsGoal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('target_amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('current_amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('target_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_savings_goals', to=settings.AUTH_USER_MODEL)),
                ('family', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='savings_goals', to='families.family')),
            ],
        ),
        migrations.CreateModel(
            name='SavingsContribution',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='savings_contributions', to=settings.AUTH_USER_MODEL)),
                ('savings_goal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contributions', to='budgets.savingsgoal')),
            ],
        ),
        migrations.CreateModel(
            name='Transaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('description', models.TextField(blank=True, null=True)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('budget', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions', to='budgets.budget')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='TransactionCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('category_type', models.CharField(choices=[('income', 'Income'), ('expense', 'Expense')], max_length=20)),
                ('family', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transaction_categories', to='families.family')),
            ],
            options={
                'verbose_name_plural': 'Transaction Categories',
                'unique_together': {('name', 'family', 'category_type')},
            },
        ),
    ]
