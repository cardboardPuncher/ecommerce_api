import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce_api.settings')
django.setup()

from products.models import Product

# Gaming images from RAWG.io (gaming database with no hotlink blocking)
# These are reliable and won't be blocked
gaming_images = {
    'elden ring': 'https://media.rawg.io/media/games/5ec/5ecac5cb026ec26a56efcc546364e348.jpg',
    'fifa': 'https://media.rawg.io/media/games/ee3/ee3e10193aafc3230ba1cae426967d10.jpg',
    'last of us': 'https://media.rawg.io/media/games/a5a/a5abaa1b5cc1567b026fa3aa9fbd828e.jpg',
    'osu': 'https://media.rawg.io/media/screenshots/a65/a65e9f01832997a4d913b3ea86319af4.jpg',
}

# Update products with reliable images
updated_count = 0
for product in Product.objects.all():
    title_lower = product.title.lower()
    for key, url in gaming_images.items():
        if key in title_lower:
            product.image_url = url
            product.save()
            print(f'Updated {product.title} with RAWG.io image')
            updated_count += 1
            break
    else:
        # Generic gaming image for others (from RAWG.io)
        if not product.image_url or 'unsplash' in product.image_url:
            product.image_url = 'https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg'
            product.save()
            print(f'Updated {product.title} with generic gaming image')
            updated_count += 1

print(f'\nUpdated {updated_count} products with RAWG.io images')
print('RAWG.io is a gaming database that allows hotlinking!')
print('These images will work reliably without being blocked.')
