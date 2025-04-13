from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Family, FamilyMembership
from .serializers import (
    FamilySerializer, FamilyMembershipSerializer,
    FamilyInvitationSerializer, FamilyInvitationResponseSerializer
)

User = get_user_model()


class FamilyListCreateView(generics.ListCreateAPIView):
    serializer_class = FamilySerializer
    
    def get_queryset(self):
        # Return families where the user is a member with accepted status
        return Family.objects.filter(
            memberships__user=self.request.user,
            memberships__status='accepted'
        ).distinct()


class FamilyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FamilySerializer
    
    def get_queryset(self):
        # Return families where the user is a member with accepted status
        return Family.objects.filter(
            memberships__user=self.request.user,
            memberships__status='accepted'
        )
    
    def perform_destroy(self, instance):
        # Only allow the creator to delete the family
        if instance.created_by != self.request.user:
            self.permission_denied(self.request, message="Only the creator can delete the family.")
        
        instance.delete()


class FamilyMemberListView(generics.ListAPIView):
    serializer_class = FamilyMembershipSerializer
    
    def get_queryset(self):
        family_id = self.kwargs.get('family_id')
        # Check if user is a member of the family
        get_object_or_404(
            FamilyMembership,
            family_id=family_id,
            user=self.request.user,
            status='accepted'
        )
        
        return FamilyMembership.objects.filter(
            family_id=family_id,
            status='accepted'
        )


class FamilyInvitationView(APIView):
    def post(self, request, family_id):
        # Check if user is an admin of the family
        family = get_object_or_404(Family, id=family_id)
        membership = get_object_or_404(
            FamilyMembership,
            family=family,
            user=request.user,
            status='accepted',
            role='admin'
        )
        
        serializer = FamilyInvitationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            invited_user = User.objects.get(email=email)
            
            # Check if user is already a member or has a pending invitation
            existing_membership = FamilyMembership.objects.filter(
                family=family,
                user=invited_user
            ).first()
            
            if existing_membership:
                if existing_membership.status == 'accepted':
                    return Response(
                        {"detail": "User is already a member of this family."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif existing_membership.status == 'pending':
                    return Response(
                        {"detail": "User already has a pending invitation to this family."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:  # rejected
                    # Update the rejected invitation to pending
                    existing_membership.status = 'pending'
                    existing_membership.invited_by = request.user
                    existing_membership.invited_at = timezone.now()
                    existing_membership.responded_at = None
                    existing_membership.save()
            else:
                # Create a new invitation
                FamilyMembership.objects.create(
                    family=family,
                    user=invited_user,
                    role='member',
                    status='pending',
                    invited_by=request.user
                )
            
            return Response(
                {"detail": f"Invitation sent to {email}."},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserInvitationsListView(generics.ListAPIView):
    serializer_class = FamilyMembershipSerializer
    
    def get_queryset(self):
        return FamilyMembership.objects.filter(
            user=self.request.user,
            status='pending'
        )


class InvitationResponseView(APIView):
    def post(self, request, invitation_id):
        invitation = get_object_or_404(
            FamilyMembership,
            id=invitation_id,
            user=request.user,
            status='pending'
        )
        
        serializer = FamilyInvitationResponseSerializer(data=request.data)
        if serializer.is_valid():
            response = serializer.validated_data['response']
            
            if response == 'accept':
                invitation.status = 'accepted'
            else:  # reject
                invitation.status = 'rejected'
            
            invitation.responded_at = timezone.now()
            invitation.save()
            
            return Response(
                {"detail": f"Invitation {response}ed."},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RemoveFamilyMemberView(APIView):
    def delete(self, request, family_id, member_id):
        # Check if user is an admin of the family
        family = get_object_or_404(Family, id=family_id)
        admin_membership = get_object_or_404(
            FamilyMembership,
            family=family,
            user=request.user,
            status='accepted',
            role='admin'
        )
        
        # Get the membership to remove
        membership_to_remove = get_object_or_404(
            FamilyMembership,
            id=member_id,
            family=family,
            status='accepted'
        )
        
        # Don't allow removing the last admin
        if membership_to_remove.role == 'admin':
            admin_count = FamilyMembership.objects.filter(
                family=family,
                status='accepted',
                role='admin'
            ).count()
            
            if admin_count <= 1:
                return Response(
                    {"detail": "Cannot remove the last admin of the family."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Delete the membership
        membership_to_remove.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class LeaveFamilyView(APIView):
    def delete(self, request, family_id):
        # Get the user's membership in the family
        membership = get_object_or_404(
            FamilyMembership,
            family_id=family_id,
            user=request.user,
            status='accepted'
        )
        
        # Check if the user is the only admin
        if membership.role == 'admin':
            admin_count = FamilyMembership.objects.filter(
                family=membership.family,
                status='accepted',
                role='admin'
            ).count()
            
            if admin_count <= 1:
                # Check if there are other members
                member_count = FamilyMembership.objects.filter(
                    family=membership.family,
                    status='accepted'
                ).count()
                
                if member_count > 1:
                    return Response(
                        {"detail": "You are the only admin. Please promote another member to admin before leaving."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        # Leave the family
        family_deleted = membership.leave_family()
        
        if family_deleted:
            return Response(
                {"detail": "You have left the family. The family has been deleted as there are no members left."},
                status=status.HTTP_200_OK
            )
        
        return Response(
            {"detail": "You have left the family."},
            status=status.HTTP_200_OK
        )


class PromoteMemberToAdminView(APIView):
    def post(self, request, family_id, member_id):
        # Check if user is an admin of the family
        family = get_object_or_404(Family, id=family_id)
        admin_membership = get_object_or_404(
            FamilyMembership,
            family=family,
            user=request.user,
            status='accepted',
            role='admin'
        )
        
        # Get the membership to promote
        membership_to_promote = get_object_or_404(
            FamilyMembership,
            id=member_id,
            family=family,
            status='accepted',
            role='member'  # Only members can be promoted
        )
        
        # Promote the member to admin
        membership_to_promote.role = 'admin'
        membership_to_promote.save()
        
        return Response(
            {"detail": f"{membership_to_promote.user.first_name} {membership_to_promote.user.last_name} has been promoted to admin."},
            status=status.HTTP_200_OK
        )
