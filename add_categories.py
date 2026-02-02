import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce_api.settings')
django.setup()

from products.models import Category

# Add gaming categories
categories = ['Action', 'RPG', 'FPS']

for cat_name in categories:
    category, created = Category.objects.get_or_create(name=cat_name)
    if created:
        print(f'Created category: {cat_name}')
    else:
        print(f'Category already exists: {cat_name}')

print('\nAll categories:')
for cat in Category.objects.all():
    print(f'- {cat.name}')
