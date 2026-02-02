import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce_api.settings')
django.setup()

from products.models import Product

# Free gaming images from Unsplash (no hotlink protection)
gaming_images = {
    'fifa': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
    'last of us': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400',
    'osu': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
}

# Update products with images
for product in Product.objects.all():
    title_lower = product.title.lower()
    for key, url in gaming_images.items():
        if key in title_lower:
            product.image_url = url
            product.save()
            print(f'Updated {product.title} with image')
            break
    else:
        # Generic gaming image for others
        if not product.image_url:
            product.image_url = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400'
            product.save()
            print(f'Updated {product.title} with generic gaming image')

print('Done!')
