from django.db import models
from django.conf import settings


class Family(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_families'
    )
    
    class Meta:
        verbose_name_plural = 'Families'
    
    def __str__(self):
        return self.name
    
    def delete_if_empty(self):
        """Delete the family if there are no members left."""
        if not self.memberships.filter(status='accepted').exists():
            self.delete()
            return True
        return False


class FamilyMembership(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('member', 'Member'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    
    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='family_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_invitations'
    )
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('family', 'user')
    
    def __str__(self):
        return f"{self.user} in {self.family} ({self.get_status_display()})"
    
    def leave_family(self):
        """Handle a user leaving a family.
        If the user is the creator of the family, delete the family.
        Otherwise, just remove the membership.
        """
        family = self.family
        is_creator = family.created_by == self.user
        
        # Delete the membership
        self.delete()
        
        # If the user is the creator, delete the family if it's empty
        if is_creator:
            return family.delete_if_empty()
        
        return False
