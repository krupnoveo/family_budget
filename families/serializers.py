from rest_framework import serializers
from .models import Family, FamilyMembership
from users.serializers import UserSerializer


class FamilySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Family
        fields = ['id', 'name', 'description', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']
    
    def create(self, validated_data):
        user = self.context['request'].user
        family = Family.objects.create(created_by=user, **validated_data)
        
        # Create membership for the creator as admin
        FamilyMembership.objects.create(
            family=family,
            user=user,
            role='admin',
            status='accepted',
            invited_by=user
        )
        
        return family


class FamilyMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    invited_by = UserSerializer(read_only=True)
    family = FamilySerializer(read_only=True)
    
    class Meta:
        model = FamilyMembership
        fields = ['id', 'family', 'user', 'role', 'status', 'invited_by', 'invited_at', 'responded_at']
        read_only_fields = ['id', 'invited_at', 'responded_at']


class FamilyInvitationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        
        return value


class FamilyInvitationResponseSerializer(serializers.Serializer):
    response = serializers.ChoiceField(choices=['accept', 'reject'], required=True) 