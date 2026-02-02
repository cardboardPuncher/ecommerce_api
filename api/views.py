from rest_framework.viewsets import ReadOnlyModelViewSet, ModelViewSet
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, ProductSerializer, CategorySerializer, OrderSerializer, OrderItemSerializer
from products.models import Product, Category
from orders.models import Order, OrderItem
from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import django_filters
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
import json
from rest_framework import generics
from products.models import Review, Wishlist
from api.serializers import ReviewSerializer, WishlistSerializer


User = get_user_model()


# ViewSet for managing users
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

# ViewSet for managing categories
class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    http_method_names = ['get', 'post', 'put', 'delete']

# FilterSet for filtering products based on price and other fields
class ProductFilter(django_filters.rest_framework.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model = Product
        fields = ['category', 'platform', 'min_price', 'max_price']

# ViewSet for managing products
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'price', 'platform']
    search_fields = ['title']
    ordering_fields = ['price', 'release_date']
    pagination_class = PageNumberPagination

# ViewSet for managing orders
class OrderViewSet(ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

# ViewSet for managing order items
class OrderItemViewSet(ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

# Custom ViewSet for User Cart Management
from rest_framework.decorators import action
from rest_framework.response import Response

class CartViewSet(ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user, status='pending')

    def list(self, request, *args, **kwargs):
        order, created = Order.objects.get_or_create(user=request.user, status='pending')
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        order, created = Order.objects.get_or_create(user=request.user, status='pending')
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        # Check if item exists in cart
        order_item, item_created = OrderItem.objects.get_or_create(order=order, product=product, defaults={'quantity': 0, 'price': product.price})
        if not item_created:
            order_item.quantity += quantity
        else:
            order_item.quantity = quantity
        
        order_item.price = product.price # Update price in case it changed
        order_item.save()
        
        return Response({'message': 'Item added to cart'})

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        order, created = Order.objects.get_or_create(user=request.user, status='pending')
        product_id = request.data.get('product_id')
        
        try:
            item = OrderItem.objects.get(order=order, product_id=product_id)
            item.delete()
            return Response({'message': 'Item removed from cart'})
        except OrderItem.DoesNotExist:
            return Response({'error': 'Item not in cart'}, status=404)

# View for listing and creating reviews
class ReviewListCreateView(generics.ListCreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Review.objects.all()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# View for listing and creating wishlist items
class WishlistListCreateView(generics.ListCreateAPIView):
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# View for deleting wishlist items
class WishlistDeleteView(generics.DestroyAPIView):
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer
    lookup_field = 'id'

# Function to register a new user
@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        username = data.get('username')
        if email and password:
            try:
                user = User.objects.create_user(email=email, username=username, password=password)
                return JsonResponse({'message': 'User registered successfully'})
            except Exception as e:
                return JsonResponse({'error': str(e)}, status=400)
        else:
            return JsonResponse({'error': 'Email and password are required'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

from rest_framework_simplejwt.tokens import RefreshToken

# Function to login a user
@csrf_exempt
def login_user(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        user = authenticate(request, email=email, password=password)
        if user is not None:
            # login(request, user)  <-- REMOVED to avoid Session/CSRF conflict
            refresh = RefreshToken.for_user(user)
            return JsonResponse({
                'message': 'User logged in successfully',
                'username': user.username,
                'is_staff': user.is_staff,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            })
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)
