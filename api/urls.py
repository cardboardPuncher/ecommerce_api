from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import UserViewSet, ProductViewSet, CategoryViewSet, OrderViewSet, OrderItemViewSet, ReviewListCreateView
from .views import register_user, login_user, WishlistListCreateView, WishlistDeleteView
from rest_framework_simplejwt.views import (
    TokenObtainPairView
)

# Create a router instance
router = DefaultRouter()

# Register viewsets with the router
router.register(r'users', UserViewSet)  # User viewset
router.register(r'products', ProductViewSet)  # Product viewset
router.register(r'categories', CategoryViewSet)  # Category viewset
router.register(r'orders', OrderViewSet)  # Order viewset
router.register(r'order-items', OrderItemViewSet)  # Order item viewset

from .views import CartViewSet
router.register(r'cart', CartViewSet, basename='cart')

# Define URL patterns
urlpatterns = [
    # Token obtain pair view
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Register user view
    path('auth/register/', register_user, name='register'),
    
    # Login user view
    path('auth/login/', login_user, name='login'),
    
    # Review list create view
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    
    # Wishlist list create view
    path('wishlist/', WishlistListCreateView.as_view(), name='wishlist-list-create'),
    
    # Wishlist delete view
    path('wishlist/<int:id>/', WishlistDeleteView.as_view(), name='wishlist-delete'),
] + router.urls 