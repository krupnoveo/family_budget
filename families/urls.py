from django.urls import path
from .views import (
    FamilyListCreateView, FamilyDetailView, FamilyMemberListView,
    FamilyInvitationView, UserInvitationsListView, InvitationResponseView,
    RemoveFamilyMemberView, LeaveFamilyView, PromoteMemberToAdminView
)

urlpatterns = [
    path('', FamilyListCreateView.as_view(), name='family-list-create'),
    path('<int:pk>/', FamilyDetailView.as_view(), name='family-detail'),
    path('<int:family_id>/members/', FamilyMemberListView.as_view(), name='family-member-list'),
    path('<int:family_id>/invite/', FamilyInvitationView.as_view(), name='family-invite'),
    path('<int:family_id>/members/<int:member_id>/', RemoveFamilyMemberView.as_view(), name='remove-family-member'),
    path('<int:family_id>/members/<int:member_id>/promote/', PromoteMemberToAdminView.as_view(), name='promote-member'),
    path('<int:family_id>/leave/', LeaveFamilyView.as_view(), name='leave-family'),
    path('invitations/', UserInvitationsListView.as_view(), name='user-invitations'),
    path('invitations/<int:invitation_id>/respond/', InvitationResponseView.as_view(), name='invitation-response'),
] 