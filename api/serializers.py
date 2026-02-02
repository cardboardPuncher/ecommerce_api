from rest_framework import serializers
from django.contrib.auth import get_user_model
from products.models import Product, Category, Review, Wishlist
from orders.models import Order, OrderItem

User = get_user_model()

# Serializer for User model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

# Serializer for Category model
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

# Serializer for Product model
class ProductSerializer(serializers.ModelSerializer):
    brand = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

# Serializer for OrderItem model
class OrderItemSerializer(serializers.ModelSerializer):
    product_info = ProductSerializer(source='product', read_only=True)
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'price', 'product_info']

# Serializer for Order model
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['user', 'items', 'status', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        
        order_items = []
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            price = product.price

            if product.stock_quantity >= quantity:
                product.stock_quantity -= quantity
                product.save()
                order_items.append(OrderItem(order=order, product=product, quantity=quantity, price=price))
            else:
                raise serializers.ValidationError("Not enough stock available")
        
        OrderItem.objects.bulk_create(order_items)
        return order

# Serializer for Review model
class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'rating', 'comment', 'created_at']
        read_only_fields = ['created_at']

# Serializer for Wishlist model
class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'product', 'added_at']
